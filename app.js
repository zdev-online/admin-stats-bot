// Файл настроек
const cfg = require('./config');

// Инцициализация VK API
const { VK } = require('vk-io');
const vk = new VK({
    token: cfg.token
});

// Разбор тела ответа
const cheerio = require('cheerio');

// Модуль запросов
const rp = require('request-promise');
const options = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 5.1; rv:52.0) Gecko/20100101 Firefox/52.0',
    transform: function (body){
        return cheerio.load(body);
    }
}

// Модуль времени (Формат)
const time = require('moment');
time.locale('ru');

// Сервера
const server = require('./servers');

vk.updates.start().then(()=>{
    console.log(`Бот запущен\nИнтервал ${cfg.time} минут`);
}).catch((error)=>{
    console.error(`Не удалось запустить бота! Ошибка: ${error.message}`);
});

vk.updates.hear(/\/get/i, (ctx,next)=>{
    if(ctx.peerType != "chat"){return ctx.send(`Доступно только в беседе`);}
    ctx.send(`ID Чата (chatId): ${ctx.chatId}\nID Назначения (peerId): ${ctx.peerId}`);
    return next();
});

setInterval(async ()=>{
    if(!cfg.peerId || !cfg.chatId){return 0;}
    let message = '🌍 Статистика онлайна\n&#13;\n';
    for(let i = 0; i < server.length; i++){
        let admins = await rp.get(server[i].admins, options).catch((e)=>{
            console.error(`Ошибка запроса: ${e}`);
        });
        let liders = await rp.get(server[i].liders, options).catch((e)=>{
            console.error(`Ошибка запроса: ${e}`);
        });

        admins = admins.text();
        liders = liders.text();

        admins = admins.replace(/\n\s/gim,'');
        liders = liders.replace(/\n\s/gim,'');

        admins = admins.match(/[0-9]+/gim);
        liders = liders.match(/[0-9]+/gim);

        message += `🌐 Сервер: ${server[i].name}\n`;
        message += `💻 Админы: ${admins[0]} ${(admins[0] <= 5) ? '🚫' : '✅'}\n`;
        message += (admins[0] <= 5) ? '❗ Нехватка администраторов!\n' : '';
        message += `👮‍♂ Лидеры: ${liders[0]} ${(liders[0] <= 5) ? '🚫' : '✅'}\n`;
        message += (liders[0] <= 5) ? '❗ Нехватка лидеров!\n&#13;\n' : '&#13;\n';
    }

    message += `📅 Дата: ${time().format('hh:mm:ss, DD.MM.YYYY')}`;

    vk.api.messages.send({
        peer_id: cfg.peerId,
        message: message
    }).catch((e)=>{
        console.error(`Ошибка отправки сообщения! ${e.message}`);
    });
}, cfg.time * 60000);
