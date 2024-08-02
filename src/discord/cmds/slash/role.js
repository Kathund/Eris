const { createMsg, createSlash } = require('../../../helper/builder.js');
	
module.exports = createSlash({
	name: 'role',
	desc: 'Add or remove a user\'s roles',
	options: [
		{ type: 'user', name: 'user', description: 'Select a user', required: true },
		{ type: 'role', name: 'role', description: 'Select a role', required: true },
		{ type: 'role', name: 'role_', description: 'Select a role' },
		{ type: 'role', name: 'role__', description: 'Select a role' },
		{ type: 'role', name: 'role___', description: 'Select a role' },
		{ type: 'role', name: 'role____', description: 'Select a role' }
	],
	permissions: ['ManageRoles'],

	async execute(interaction) 
	{
		await interaction.deferReply();

		const user = interaction.options.getMember('user');
		const roles = [
			interaction.options.getRole('role'),
			interaction.options.getRole('role_'),
			interaction.options.getRole('role__'),
			interaction.options.getRole('role___'),
			interaction.options.getRole('role____'),
			interaction.options.getRole('role_____')
		].filter(role => role);

		const uniqueRoles = Array.from(new Set(roles.map(role => role.id))).map(id => roles.find(role => role.id === id));
		const noPerms = uniqueRoles.filter(role => role.managed || interaction.member.roles.highest.comparePositionTo(role) <= 0);
		const validRoles = uniqueRoles.filter(role => !noPerms.includes(role));

		if (noPerms.length > 0) 
		{
			const noPermRoles = noPerms.map(role => `- <@&${role.id}>`).join('\n');
			await interaction.followUp({ embeds: [createMsg({ color: 'FF0000', desc: `**You do not have permission to manage these roles:**\n\n${noPermRoles}` })] });
		}

		const roleAdd = validRoles.filter(role => !user.roles.cache.has(role.id));
		const roleRemove = validRoles.filter(role => user.roles.cache.has(role.id));

		if (roleRemove.length > 0) await user.roles.remove(roleRemove);
		if (roleAdd.length > 0) await user.roles.add(roleAdd);

		if (roleAdd.length > 0 || roleRemove.length > 0) {
			const addedRoles = roleAdd.map(role => `+ <@&${role.id}>`).join('\n');
			const removedRoles = roleRemove.map(role => `- <@&${role.id}>`).join('\n');
			const desc = [addedRoles, removedRoles].filter(Boolean).join('\n');

			const embed = createMsg({ desc: `${user} **Updated roles!**\n\n${desc}` });
			await interaction.followUp({ embeds: [embed] });
		}
	}
});