const mainModule = require('../bot.js');
const utils = require('../utils/utils.js');
const { exec } = require('child_process');
const configTools = require('../utils/configTools.js');
module.exports = {
  channelCreate: async channel => {
    if (!channel.guild) return;
    const ingoredChannels = await utils.getIgnoredChannels(channel.guild.id)
                            .catch(err => {return});
    if (ingoredChannels) {
      const arr = ingoredChannels.split(' ');
      if (arr.includes(channel.id)) return;
    }
    utils.getActionChannel(channel.guild.id, 'log').then(log => {
      if (log) {
        channel.guild.channels.get(log).send({
          embed: {
            color: 1571692,
            title: '📜✅ Channel created',
            fields: [{
              name: 'Name',
              value: channel.name,
            }, {
              name: 'Type',
              value: channel.type,
            }
            ],
            timestamp: new Date(),
          },
        });
      }
    }).catch(err => {
      console.log('[WARN] Logging disabled during channelCreate');
    });
  },

  channelDelete: async channel => {
    if (!channel.guild) return;
    const ingoredChannels = await utils.getIgnoredChannels(channel.guild.id)
                            .catch(err => {return});
    if (ingoredChannels) {
      const arr = ingoredChannels.split(' ');
      if (arr.includes(channel.id)) return;
    }
    utils.getActionChannel(channel.guild.id, 'log').then(log => {
      if (log) {
        channel.guild.channels.get(log).send({
          embed: {
            color: 1571692,
            title: '📜❌ Channel deleted',
            fields: [{
              name: 'Name',
              value: channel.name,
            }, {
              name: 'Type',
              value: channel.type,
            }
            ],
            timestamp: new Date(),
          },
        });
      }
    }).catch(err => {
      console.log('[WARN] Logging disabled during channelDelete');
    });
  },

  guildMemberAdd: async member => {
    utils.getActionChannel(member.guild.id, 'log').then(log => {
      if (log) {
        member.guild.channels.get(log).send({
          embed: {
            color: 1571692,
            title: '✅ Member joined',
            fields: [{
              name: 'Name',
              value: member.user.tag,
            }, {
              name: 'ID',
              value: member.id,
            }, {
              name: 'Account creation date',
              value: `${member.user.createdAt.toDateString()} - ${member.user.createdAt.toTimeString()}`,
            }],
            timestamp: new Date(),
            thumbnail: {
              url: member.user.avatarURL() ? member.user.avatarURL() : 'https://cdn.discordapp.com/attachments/328763359535169547/468903512273715200/damn.png',
            },
          },
        });
      }
    }).catch(err => {
      console.log('[WARN] Logging disabled during guildMemberAdd');
    });
  },

  guildMemberRemove: async member => {
    utils.getActionChannel(member.guild.id, 'log').then(log => {
      if (log) {
        member.guild.channels.get(log).send({
          embed: {
            color: 1571692,
            title: '❌ Member left',
            fields: [{
              name: 'Name',
              value: member.user.tag,
            }, {
              name: 'ID',
              value: member.id,
            }
            ],
            timestamp: new Date(),
            thumbnail: {
              url: member.user.avatarURL() ? member.user.avatarURL() : 'https://cdn.discordapp.com/attachments/328763359535169547/468903512273715200/damn.png',
            },
          },
        });
      }
    }).catch(err => {
      console.log('[WARN] Logging disabled during guildMemberRemove');
    });
  },

  guildMemberUpdate: async (oldMember, newMember) => {
    let title;
    let change;
    if (oldMember.nickname !== newMember.nickname) {
      title = 'Nickname updated';
      change = `\`${oldMember.nickname ? oldMember.nickname : '***No nickname***'}\` --> \`${newMember.nickname ? newMember.nickname : '***No nickname***'}\``;
    }
    else if (oldMember.roles.array().length !== newMember.roles.array().length) {
      title = 'Roles updated';
      const oldRoles = oldMember.roles.array();
      let oldRolesChange = [];
      const newRoles = newMember.roles.array();
      let newRolesChange = [];

      for (let i = 0; i < oldRoles.length; i += 1) {
        oldRolesChange.push(oldRoles[i].name);
      }

      for (let i = 0; i < newRoles.length; i += 1) {
        newRolesChange.push(newRoles[i].name);
      }

      change = `Old: ${oldRolesChange.join(', ')}\nNew: ${newRolesChange.join(', ')}`;
    }

    if (!change) return console.log('[WARN] Change was empty in guildMemberUpdate!');
    const embed = {
      color: 1571692,
      title: title,
      fields: [{
        name: 'User',
        value: newMember.user.tag,
      }, {
        name: 'Change',
        value: change.substring(0, 1000),
      }
      ],
      timestamp: new Date(),
    };
    utils.getActionChannel(newMember.guild.id, 'log').then(log => {
      if (log) {
        newMember.guild.channels.get(log).send({embed}).catch(err => console.log(`[ERROR] Sending message failed in logging ${err}`));
      }
    }).catch(err => {
      console.log('[WARN] Logging disabled during guildMemberUpdate');
    });
  },

  messageDelete: async message => {
    if (!message.guild) return;
    const ingoredChannels = await utils.getIgnoredChannels(message.guild.id)
                            .catch(err => {return});
    if (ingoredChannels) {
      const arr = ingoredChannels.split(' ');
      if (arr.includes(message.channel.id)) return;
    }
    utils.getActionChannel(message.guild.id, 'log').then(async log => {
      if (log === message.channel.id) {
        let conf = await configTools.getConfig(message.guild)
            .catch(err => console.log(err));
        // if (!conf) conf = CONFIG.defaultConfig;
        // conf = configTools.decodeConfig(conf);
        if (!(conf instanceof Error) && conf.logNoD) {
          message.guild.fetchAuditLogs().then(async audit => {
            const embed = {};
            
            if (audit.entries.first().action === 'MESSAGE_DELETE' &&
                audit.entries.first().target.id === mainModule.client.user.id &&
                message.embeds[0] &&
                !await utils.isWhitelisted(message.guild, message.guild.member(audit.entries.first().executor), 'logAntiDelete')) {
              embed.color = 11736341;
              embed.title = 'Someone may have tried to delete logs';
              embed.description = `${audit.entries.first().executor.tag} may have tried to delete a message in logs! Trying to recover and resend in the next message`;
              embed.timestamp = new Date();
              const embedResend = message.embeds[0];

              message.guild.channels.get(log).send({embed});
              message.guild.channels.get(log).send(embedResend);
            }
          }).catch(err => console.log(`[DEBUG] audit error ${err}`));
        }
      }
      if (log) {
        const fields = [{
          name: 'User',
          value: `${message.author.tag} - ${message.author.id}`,
        }];

        let content;
        if (message.content) content = message.content;
        else content = '***Empty message***';

        fields.push({
          name: 'Message',
          value: content.substring(0, 1000),
        });

        if (message.attachments.array().length > 0) {
          const attachmentsArray = message.attachments.array();
          const attachmentUrls = [];
          for (let i = 0; i < attachmentsArray.length; i += 1) {
            attachmentUrls.push(attachmentsArray[i].url);
          }
          fields.push({
            name: 'Attachments',
            value: attachmentUrls.join('\n').substring(0, 1000),
          })
        }

        message.guild.channels.get(log).send({
          embed: {
            color: 1571692,
            title: '📜❌ Message deleted',
            description: `Message deleted in **#${message.channel.name}**`,
            fields: fields,
            timestamp: new Date(),
          },
        });
      }
    }).catch(err => {
      console.log('[WARN] Logging disabled during messageDelete OR message content was blank');
    });
  },

  messageDeleteBulk: async messages => {
    if (messages.first().guild) {
      const ingoredChannels = await utils.getIgnoredChannels(messages.first().guild.id)
                              .catch(err => {return});
      if (ingoredChannels) {
        const arr = ingoredChannels.split(' ');
        if (arr.includes(messages.first().channel.id)) return;
      }
      let conf = await configTools.getConfig(messages.first().guild)
          .catch(err => console.log(err));
      // if (!conf) conf = CONFIG.defaultConfig;
      // conf = configTools.decodeConfig(conf);
      if (!(conf instanceof Error)) {
        if (!conf.logMassDelHaste) return;
        const msgArray = messages.array();
        const content = [];

        content.push(`***Bulk message delete log at ${new Date().toUTCString()} on guild ${messages.first().guild.name} in channel #${messages.first().channel.name}. (All quotes have been removed)***`);
        for (let i = msgArray.length - 1; i > 0; i -= 1) {
          if (msgArray[i].embeds[0]) {
            // Ignore this mess
            const humanFields = [];
            if (msgArray[i].embeds[0].fields) {
              for (let j = 0; j < msgArray[i].embeds[0].fields.length; j += 1) {
                humanFields.push(`[FIELD] Name: ${msgArray[i].embeds[0].fields[j].name}
                          Value: ${msgArray[i].embeds[0].fields[j].value}
                          Inline: ${msgArray[i].embeds[0].fields[j].inline}
                `);
              }
            }

            content.push(`[EMBED][${new Date(msgArray[i].createdTimestamp).toUTCString()}] ${msgArray[i].author.tag}:
                          Author: ${msgArray[i].embeds[0].author}
                          Colour: ${msgArray[i].embeds[0].color}
                          Title: ${msgArray[i].embeds[0].title}
                          Description: ${msgArray[i].embeds[0].description}
                          Fields: ${humanFields.join('\n                          ')}
                          Footer: ${msgArray[i].embeds[0].footer ? `Text: ${msgArray[i].embeds[0].footer.text} iconURL: ${msgArray[i].embeds[0].footer.iconURL}` : 'No footer'}\n
                          Image: ${msgArray[i].embeds[0].image ? msgArray[i].embeds[0].image.url : 'No image'}\n
                          Thumbnail:  ${msgArray[i].embeds[0].thumbnail ? msgArray[i].embeds[0].thumbnail.url : 'No thumbnail'}\n
            `);
          }
          content.push(`[${new Date(msgArray[i].createdTimestamp).toUTCString()}] ${msgArray[i].author.tag} - ${msgArray[i].content}`);
        }

        exec(`echo "${content.join('\n').replace('"', '').replace('(', '').replace(')', '').replace(/\`/g, '')}" | haste`, (err, stdout, stderr) => {
          if (err) return console.log(err);
          else if (stderr) return console.log(stderr);
          else {
            utils.getActionChannel(messages.first().guild.id, 'log').then(log => {
              messages.first().guild.channels.get(log).send({
                embed: {
                  color: 1571692,
                  title: 'Bulk messages deleted',
                  description: `Deleted messages put into hastebin: ${stdout}`,
                  timestamp: new Date(),
                },
              });
            }).catch(err => console.log('[WARN] Logging disabled during messageDeleteBulk'));
          }
        });
      }
    }
  },

  messageUpdate: async (oldMessage, newMessage) => {
    if (!newMessage.guild) return;
    const ingoredChannels = await utils.getIgnoredChannels(newMessage.guild.id)
                            .catch(err => {return});
    if (ingoredChannels) {
      const arr = ingoredChannels.split(' ');
      if (arr.includes(newMessage.channel.id)) return;
    }
    utils.getActionChannel(newMessage.guild.id, 'log').then(log => {
      if (log && newMessage.content && oldMessage.content && newMessage.content !== oldMessage.content) {
        newMessage.guild.channels.get(log).send({
          embed: {
            color: 1571692,
            title: '📝 Message updated',
            description: `Message by **${newMessage.author.tag}** updated in **#${newMessage.channel.name}**`,
            fields: [{
              name: 'Old content',
              value: oldMessage.content.substring(0, 1000),
            }, {
              name: 'New content',
              value: newMessage.content.substring(0, 1000),
            }
            ],
            timestamp: new Date(),
          },
        });
      }
    }).catch(err => {
      console.log('[WARN] Logging disabled during messageUpdate OR message content was blank');
      console.log(err);
    });
  },

  userUpdate: async (oldUser, newUser) => {
    const fields = [];
    let embed;
    if (oldUser.tag !== newUser.tag && oldUser.avatarURL() !== newUser.avatarURL()) {
      embed = {
        embed: {
          color: 1571692,
          title: 'User updated',
          description: '(Thumbnail is old avatar, image is new avatar)',
          fields: [{
            name: 'Name and avatar change',
            value: `${oldUser.tag} --> ${newUser.tag}`,
          }],
          thumbnail: {
            url: (oldUser.avatarURL() ? oldUser.avatarURL() : 'https://cdn.discordapp.com/attachments/328763359535169547/468903512273715200/damn.png'),
          },
          image: {
            url: (newUser.avatarURL() ? newUser.avatarURL() : 'https://cdn.discordapp.com/attachments/328763359535169547/468903512273715200/damn.png'),
          },
          timestamp: new Date(),
        },
      };
    } else if (oldUser.tag !== newUser.tag) {
      embed = {
        embed: {
          color: 1571692,
          title: 'User updated',
          fields: [{
            name: 'Name change',
            value: `${oldUser.tag} --> ${newUser.tag}`,
          }],
          timestamp: new Date(),
        },
      };
    } else if (oldUser.avatarURL() !== newUser.avatarURL()) {
      embed = {
        embed: {
          color: 1571692,
          title: 'User updated',
          description: `**${newUser.tag}** changed their avatar (Thumbnail is old avatar, image is new avatar)`,
          thumbnail: {
            url: (oldUser.avatarURL() ? oldUser.avatarURL() : 'https://cdn.discordapp.com/attachments/328763359535169547/468903512273715200/damn.png'),
          },
          image: {
            url: (newUser.avatarURL() ? newUser.avatarURL() : 'https://cdn.discordapp.com/attachments/328763359535169547/468903512273715200/damn.png'),
          },
          timestamp: new Date(),
        },
      };
    }

    const mutualGuilds = utils.getMutualGuilds(newUser);
    for (let i = 0; i < mutualGuilds.length; i += 1) {
      utils.getActionChannel(mutualGuilds[i].id, 'log').then(log => {
        mutualGuilds[i].channels.get(log).send(embed);
      }).catch(err => console.log(`[DEBUG] Skipping non mutual guild to user GUILD: ${mutualGuilds[i].name} USER: ${newUser.tag} ERR: ${err}`));
    }
  },

  channelUpdate: async (oldChannel, newChannel) => {
    if (newChannel.guild) {
      const ingoredChannels = await utils.getIgnoredChannels(newChannel.guild.id)
                              .catch(err => {return});

      const statChannels = await utils.getStatChannels(newChannel.guild.id)
                                 .catch(err => {
                                    return;
                                 });

      let json;
      if (statChannels) {
        json = JSON.parse(statChannels);

        for (let property in json) {
          if (json.hasOwnProperty(property)) {
            if (newChannel.id === json[property])
              return;
          }
        }
      }
      
      if (ingoredChannels) {
        const arr = ingoredChannels.split(' ');
        if (arr.includes(newChannel.channel.id)) return;
      }
      const fields = [];
      console.log(`OLD: ${oldChannel.rawPosition} ${oldChannel.name} NEW: ${newChannel.rawPosition} ${newChannel.name}`);
      if (oldChannel.name !== newChannel.name) {
        fields.push({
          name: 'Name changed',
          value: `${oldChannel.name} --> ${newChannel.name}`,
        });
      } else if (oldChannel.rawPosition !== newChannel.rawPosition) {
        fields.push({
          name: 'Position changed',
          value: `${oldChannel.rawPosition} --> ${newChannel.rawPosition}`,
        }, {
          name: 'Type',
          value: newChannel.type,
        });
      }
      if (fields.length > 0) {
        utils.getActionChannel(newChannel.guild.id, 'log').then(log => {
          newChannel.guild.channels.get(log).send({
            embed: {
              color: 1571692,
              title: `Channel #${newChannel.name} updated`,
              fields: fields,
              timestamp: new Date(),
            },
          }).catch(err => console.log(`[DEBUG] Cant send message ${err}`));
        }).catch(err => console.log(`[DEBUG] Logging not enabled during channelUpdate ${err}`));
      } else console.log('fields less than 0');
    }
  },

  roleCreate: async role => {
    utils.getActionChannel(role.guild.id, 'log').then(log => {
      if (log) {
        role.guild.channels.get(log).send({
          embed: {
            color: role.color,
            title: '✅ Role created',
            fields: [{
              name: 'Name',
              value: role.name,
            }, {
              name: 'ID',
              value: role.id,
            }
            ],
            timestamp: new Date(),
          },
        });
      }
    }).catch(err => {
      console.log('[WARN] Logging disabled during roleCreate');
    });
  },

  roleDelete: async role => {
    utils.getActionChannel(role.guild.id, 'log').then(log => {
      if (log) {
        role.guild.channels.get(log).send({
          embed: {
            color: role.color,
            title: '❌ Role deleted',
            fields: [{
              name: 'Name',
              value: role.name,
            }, {
              name: 'ID',
              value: role.id,
            }
            ],
            timestamp: new Date(),
          },
        });
      }
    }).catch(err => {
      console.log('[WARN] Logging disabled during roleDreate');
    });
  },

  guildBanAdd: async (guild, user) => {
    utils.getActionChannel(guild.id, 'log').then(log => {
      guild.channels.get(log).send({
        embed: {
          color: 1571692,
          title: '⛔ Member banned',
          fields: [{
            name: 'Name',
            value: user.tag,
          }, {
            name: 'ID',
            value: user.id,
          }
          ],
          timestamp: new Date(),
        },
      });
    }).catch(err => console.log('[WARN] Logging disabled during guildBanAdd'));
  },

  guildBanRemove: async (guild, user) => {
    utils.getActionChannel(guild.id, 'log').then(log => {
      guild.channels.get(log).send({
        embed: {
          color: 1571692,
          title: '✅ Member unbanned',
          fields: [{
            name: 'Name',
            value: user.tag,
          }, {
            name: 'ID',
            value: user.id,
          }
          ],
          timestamp: new Date(),
        },
      });
    }).catch(err => console.log('[WARN] Logging disabled during guildBanAdd'));;
  },
};