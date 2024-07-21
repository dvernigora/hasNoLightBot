const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');

const bot = new Telegraf('7288487795:AAGIeSjEzyoV9wejKTHg36thAm7BOyFIXF4');
const url = 'https://kiroe.com.ua/electricity-blackout/websearch/100776?ajax=1';

const time = {
    'H01': {
        start: '00:00',
        end: '01:00',
    },
    'H02': {
        start: '01:00',
        end: '02:00',
    },
    'H03': {
        start: '02:00',
        end: '03:00',
    },
    'H04': {
        start: '03:00',
        end: '04:00',
    },
    'H05': {
        start: '04:00',
        end: '05:00',
    },
    'H06': {
        start: '05:00',
        end: '06:00',
    },
    'H07': {
        start: '06:00',
        end: '07:00',
    },
    'H08': {
        start: '07:00',
        end: '08:00',
    },
    'H09': {
        start: '08:00',
        end: '09:00',
    },
    'H10': {
        start: '09:00',
        end: '10:00',
    },
    'H11': {
        start: '10:00',
        end: '11:00',
    },
    'H12': {
        start: '11:00',
        end: '12:00',
    },
    'H13': {
        start: '12:00',
        end: '13:00',
    },
    'H14': {
        start: '13:00',
        end: '14:00',
    },
    'H15': {
        start: '14:00',
        end: '15:00',
    },
    'H16': {
        start: '15:00',
        end: '16:00',
    },
    'H17': {
        start: '16:00',
        end: '17:00',
    },
    'H18': {
        start: '17:00',
        end: '18:00',
    },
    'H19': {
        start: '18:00',
        end: '19:00',
    },
    'H20': {
        start: '19:00',
        end: '20:00',
    },
    'H21': {
        start: '20:00',
        end: '21:00',
    },
    'H22': {
        start: '21:00',
        end: '22:00',
    },
    'H23': {
        start: '22:00',
        end: '23:00',
    },
    'H24': {
        start: '23:00',
        end: '24:00',
    },
};

const schedule = {
    DayNo: 4,
    DayName: 'Чт, 18.07',
    IsToday: 1,
    H01: 0,
    H02: 0,
    H03: 0,
    H04: 0,
    H05: 0,
    H06: 0,
    H07: 0,
    H08: 0,
    H09: 0,
    H10: 0,
    H11: 0,
    H12: 0,
    H13: 0,
    H14: 0,
    H15: 0,
    H16: 0,
    H17: 1,
    H18: 1,
    H19: 0,
    H20: 1,
    H21: 1,
    H22: 0,
    H23: 0,
    H24: 0
};



const parseSchedule = schedule => {
    let isSwitchedLight = schedule['H01'];
    let message = '';

    Object.entries(time).forEach(([currentHourName, currentHourVal], i) => {
        currentHourVal.hasLight = schedule[currentHourName];
    });

    let firstPeriod = '';
    let secondPeriod = '';

    Object.entries(time).forEach(([periodName,period]) => {
        const nextIndex = Object.keys(time).findIndex(name => name === periodName) + 1;
        const nextKey = Object.keys(time)[nextIndex];
        const nextPeriod = time[nextKey] || {
            start: '24:00',
            end: '',
            hasLight: !period.hasLight,
        };

        if (!firstPeriod) {
            firstPeriod = period.start;
        }

        if (isSwitchedLight !== nextPeriod.hasLight) {
            secondPeriod = nextPeriod.start;
            const hasLightStr = period.hasLight ? '+ +' : '- - -';
            message += `з ${firstPeriod} до ${secondPeriod} ${hasLightStr} \n`
            isSwitchedLight = nextPeriod.hasLight;
            firstPeriod = '';
        }
    });

    return message;
};

bot.start((ctx) => ctx.reply('Привіт! Я бот, який підкаже графік погодинних відключень у садовому товаристві "Ятрань". Натисніть команду /get щоб дізнатися графік.'));

bot.command('get', async (ctx) => {

    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            const schedule = data.data[0]['Shedule'];
            const date = new Date(data.data[0]['SearchDate']);
            const today = schedule.find(day => day['IsToday']);
            const title = data.data[0]['SheduleTitle'];
            const minutes = date.getMinutes().length === 1 ? `0${date.getMinutes()}` : date.getMinutes();

            let message = `${title} \n`
            message = message.replace('<b>', '');
            message = message.replace('</b>', '');
            message += `Станом на ${date.getHours()}:${minutes} графік такий: \n \n`;
            message += parseSchedule(today);
            message += '\n Натисніть команду /get щоб перевірити знову.'

            ctx.reply(message);
        } else {
            ctx.reply('Не вдалося отримати дані. Спробуйте пізніше.');
        }
    } catch (error) {
        ctx.reply(`Сталася помилка: ${error.message}`);
    }
});

bot.launch();
console.log('Bot is running.');

