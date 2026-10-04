require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const config = require('./config');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// عداد خاص لكل تخصص
const ticketCounters = {};

client.once(Events.ClientReady, async (c) => {
  try {
    const guild = await c.guilds.fetch(process.env.GUILD_ID);
    await guild.commands.set([
      {
        name: 'setup-tickets',
        description: 'إرسال لوحة فتح تذاكر التقديم',
        defaultMemberPermissions: PermissionFlagsBits.Administrator,
      },
    ]);
    console.log(`✅ البوت شغال بنجاح: ${c.user.tag}`);
  } catch (err) {
    console.error('⚠️ خطأ في الاتصال بالسيرفر:', err.message);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // 1) أمر إرسال اللوحة الرئيسية
    if (interaction.isChatInputCommand() && interaction.commandName === 'setup-tickets') {
      const embed = new EmbedBuilder()
        .setColor(0x2f3136)
        .setDescription('للتقديم إلى الفريق، اختر التخصص الذي ترغب في التقديم إليه.');

      const buttons = config.specializations.map((s) =>
        new ButtonBuilder()
          .setCustomId(`spec_${s.id}`)
          .setLabel(s.label)
          .setStyle(ButtonStyle.Success)
      );

      const row = new ActionRowBuilder().addComponents(buttons);

      await interaction.channel.send({
        embeds: [embed],
        components: [row],
      });
      return interaction.reply({ content: '✅ تم إرسال لوحة التقديم بنجاح.', flags: MessageFlags.Ephemeral });
    }

    // 2) عند الضغط على أحد أزرار التخصصات لفتح التذكرة
    if (interaction.isButton() && interaction.customId.startsWith('spec_')) {
      const specId = interaction.customId.replace('spec_', '');
      const spec = config.specializations.find((s) => s.id === specId);
      if (!spec) return;

      const staffRole = interaction.guild.roles.cache.get(config.staffRoleId) || await interaction.guild.roles.fetch(config.staffRoleId).catch(() => null);

      if (!staffRole) {
        return interaction.reply({
          content: '❌ خطأ: لم يتم العثور على رتبة المشرفين. تأكد من صحة staffRoleId في ملف config.js',
          flags: MessageFlags.Ephemeral,
        });
      }

      // منع فتح أكثر من تذكرة لنفس الشخص
      const existing = interaction.guild.channels.cache.find(
        (ch) => ch.topic === `ticket:${interaction.user.id}`
      );
      if (existing) {
        return interaction.reply({
          content: `❌ لديك تذكرة مفتوحة بالفعل: ${existing}`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // زيادة عداد التخصص المحدد فقط (يبدأ من 1)
      if (!ticketCounters[spec.id]) {
        ticketCounters[spec.id] = 0;
      }
      ticketCounters[spec.id]++;
      const currentTicketNumber = ticketCounters[spec.id];

      // صياغة اسم القناة حسب التخصص والتسلسل الخاص به
      const channelName = `${spec.label}-${currentTicketNumber}`.toLowerCase().replace(/\s+/g, '-');

      // صلاحيات القناة
      const permissionOverwrites = [
        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ManageChannels,
          ],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: staffRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ];

      const channelOptions = {
        name: channelName,
        type: ChannelType.GuildText,
        topic: `ticket:${interaction.user.id}`,
        permissionOverwrites,
      };

      if (config.categoryId && interaction.guild.channels.cache.has(config.categoryId)) {
        channelOptions.parent = config.categoryId;
      }

      const channel = await interaction.guild.channels.create(channelOptions);

      const dateString = new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const embed = new EmbedBuilder()
        .setColor(0x2f3136)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `👤 | **مالك التذكرة** : ${interaction.user}\n` +
          `🛡️ | **مشرفي التذاكر** : <@&${staffRole.id}>\n\n` +
          `📅 | **تاريخ التذكرة** :\n\`${dateString}\`\n\n` +
          `📂 | **قسم التذكرة** : \`${spec.label}\` | 🔢 | **رقم التذكرة** : \`${currentTicketNumber}\`\n\n` +
          `───────────────\n` +
          `📝 | **شرح الاختبار** :\n${spec.description}\n\n` +
          `⏱️ | **مدة الاختبار** : \`${spec.duration}\``
        );

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('بدء الاختبار 🔗')
          .setStyle(ButtonStyle.Link)
          .setURL(spec.testUrl),
        new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('استلام 💼')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('إغلاق التذكرة 🗃️')
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({
        content: `${interaction.user} | <@&${staffRole.id}>`,
        embeds: [embed],
        components: [actionRow],
      });

      return interaction.reply({ content: `✅ تم فتح تذكرتك بنجاح: ${channel}`, flags: MessageFlags.Ephemeral });
    }

    // 3) زر استلام التذكرة
    if (interaction.isButton() && interaction.customId === 'ticket_claim') {
      const isStaff = interaction.member.roles.cache.has(config.staffRoleId);
      if (!isStaff) {
        return interaction.reply({ content: '❌ هذا الزر مخصص للإدارة والمختبرين فقط.', flags: MessageFlags.Ephemeral });
      }
      await interaction.reply({ content: `💼 تم استلام التذكرة بواسطة ${interaction.user}` });
    }

    // 4) زر إغلاق التذكرة
    if (interaction.isButton() && interaction.customId === 'ticket_close') {
      const isOwner = interaction.channel.topic === `ticket:${interaction.user.id}`;
      const isStaff = interaction.member.roles.cache.has(config.staffRoleId);
      if (!isOwner && !isStaff) {
        return interaction.reply({ content: '❌ ليس لديك صلاحية لإغلاق التذكرة.', flags: MessageFlags.Ephemeral });
      }
      await interaction.reply('🔒 سيتم إغلاق وحذف التذكرة خلال 5 ثوانٍ...');
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  } catch (err) {
    console.error('حدث خطأ:', err);
  }
});

client.login(process.env.TOKEN);

const http = require('http');

// إنشاء سيرفر وهمي لإبقاء الخطة المجانية على Render نشطة
http.createServer((req, res) => {
  res.write("Bot is running!");
  res.end();
}).listen(process.env.PORT || 3000);