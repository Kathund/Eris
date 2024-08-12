const { createMsg, createSlash } = require('../../../helper/builder.js');
const db = require('../../../mongo/schemas.js');
const { readConfig, getEmoji, getPlayer, getGuild, getSBLevelHighest } = require('../../../helper/utils.js');
	
module.exports = createSlash({
	name: 'roles',
	desc: 'Update your roles',

	async execute(interaction) 
	{
		await interaction.deferReply({ ephemeral: true });

		const config = readConfig();
		const user = interaction.user.id;
		const plus = await getEmoji('plus');
		const minus = await getEmoji('minus');
		
		try 
		{
			const data = await db.Link.findOne({ dcid: user }).exec();
			const uuid = data.uuid;
			const player = await getPlayer(uuid);

			try { await interaction.member.setNickname(player.nickname); } 
			catch (e) 
			{ 
				if (e.message.includes('Missing Permissions')) 
				{ 
					await interaction.followUp({ embeds: [createMsg({ color: 'FFA500', desc: '**Silly! I cannot change the nickname of the server owner!**' })] });
				} 
			}

			const addedRoles = [];
			const removedRoles = [];

			// Assign Linked and Guild Role
			if (config.features.linkRoleToggle)
			{
				if (!interaction.member.roles.cache.has(config.features.linkRole))
				{
					await interaction.member.roles.add(config.features.linkRole);
					addedRoles.push(config.features.linkRole);
				}
			}
			if (config.features.guildRoleToggle) 
			{
				const guild = await getGuild('player', player.uuid);
				if (guild && guild.name === config.guild)
				{
					if (!interaction.member.roles.cache.has(config.features.guildRole))
					{
						await interaction.member.roles.add(config.features.guildRole); 
						addedRoles.push(config.features.guildRole);
					}
				}
				else
				{
					if (interaction.member.roles.cache.has(config.features.guildRole))
					{
						await interaction.member.roles.remove(config.features.guildRole); 
						removedRoles.push(config.features.guildRole);
					}
				}
			}

			// Assign SB Level Role
			if (config.features.levelRolesToggle)
			{
				const highestLevel = await getSBLevelHighest(player);
				const roleIndex = Math.min(config.levelRoles.length - 1, Math.floor(highestLevel / 40));
				const assignedRole = config.levelRoles[roleIndex];
			
				if (!interaction.member.roles.cache.has(assignedRole)) 
				{
					await interaction.member.roles.add(assignedRole);
					addedRoles.push(assignedRole);
				}
				for (const role of config.levelRoles) 
				{
					if (interaction.member.roles.cache.has(role) && role !== assignedRole)
					{
						await interaction.member.roles.remove(role);
						removedRoles.push(role);
					}
				}
			}

			let desc;
			if (addedRoles.length > 0 && removedRoles.length > 0)
			{
				desc = '**Your roles have been updated!**\n_ _\n';
				desc += `${addedRoles.map(roleId => `${plus} <@&${roleId}>`).join('\n')}\n_ _\n`;
				desc += `${removedRoles.map(roleId => `${minus} <@&${roleId}>`).join('\n')}`;
			}
			else if (addedRoles.length > 0)
			{
				desc = '**Your roles have been updated!**\n_ _\n';
				desc += `${addedRoles.map(roleId => `${plus} <@&${roleId}>`).join('\n')}\n_ _`;
			}
			else if (removedRoles.length > 0)
			{
				desc = '**Your roles have been updated!**\n_ _\n';
				desc += `${removedRoles.map(roleId => `${minus} <@&${roleId}>`).join('\n')}\n_ _`;
			}
			else
			{
				desc = '**Your roles are up to date!**';
			}

			return interaction.followUp({ embeds: [createMsg({ desc: desc })] });
		} 
		catch (error) 
		{
			throw error;
		}

	}
});
