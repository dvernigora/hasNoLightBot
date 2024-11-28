const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const fs = require('node:fs/promises');
const cron = require('node-cron');

const bot = new Telegraf('7288487795:AAGIeSjEzyoV9wejKTHg36thAm7BOyFIXF4');
const url = 'https://kiroe.com.ua/electricity-blackout/websearch/v2/110686?ajax=1';

const isTest = true;

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





const parseSchedule = ({ dayToRender, isShowJustNoLight }) => {
    let isSwitchedLight = dayToRender['H01'];
    let message = '';

    Object.entries(time).forEach(([currentHourName, currentHourVal], i) => {
        currentHourVal.hasLight = dayToRender[currentHourName];
    });

    let firstPeriod = '';
    let secondPeriod = '';

    let hasNoLight = false;

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

            if (isShowJustNoLight) {
                if (!period.hasLight) {
                    message += `з ${firstPeriod} до ${secondPeriod} \n`;
                    if (!hasNoLight) {
                        hasNoLight = true;
                    }
                }
            } else {
                const hasLightStr = period.hasLight ? '+ +' : '- - -';
                message += `з ${firstPeriod} до ${secondPeriod} ${hasLightStr} \n`
            }

            isSwitchedLight = nextPeriod.hasLight;
            firstPeriod = '';
        }
    });

    return { hasNoLight, message };
};

const getSchedule = async ctx => {
    try {
        if (isTest) {
            const dbContent = await fs.readFile('./test-db.json', { encoding: 'utf8' });
            return {'Shedule': [JSON.parse(dbContent)]};
        }

        const response = await fetch(url);

        if (response.ok) {
            const data = await response.json();
            return data.data[0];
        } else {
            ctx.reply('Не вдалося отримати дані. Спробуйте пізніше.');
            return {};
        }
    } catch (error) {
        ctx.reply(`Сталася помилка: ${error.message}`);
        return {};
    }
};

const getIsScheduleWasChanged = async schedule => {
    try {
        const dbContent = await fs.readFile('./db.json', { encoding: 'utf8' });
        const dataFromDb = JSON.parse(dbContent);

        const today = schedule.find(day => day['IsToday']);
        const todayStr = JSON.stringify(today);

        console.log(typeof dbContent, dbContent);
        console.log(typeof todayStr, todayStr);
        console.log(dataFromDb.DayName, today.DayName);

        return dbContent !== todayStr && dataFromDb.DayName === today.DayName;
    } catch (e) {
        console.log(e);
    }
};

const buttons = {
    reply_markup: {
        inline_keyboard: [
            [ { text: "Графік на сьогодні", callback_data: 'get' }, { text: 'Графік на завтра', callback_data: 'getTomorow' } ],
            [ { text: 'Не сповіщати про зміни у графіку', callback_data: 'stop' } ],
        ]
    }
};

const runParse = async (params = {}) => {
    const isShowJustNoLight = true;

    const { isParseByCron, ctx, isGetTomorow } = params;
    const lastDayNum = 7;
    const data = await getSchedule(ctx);
    const schedule = data['Shedule'];
    const today = schedule.find(day => day['IsToday']);
    const tomorowDayNum = today['DayNo'];

    let dayToRender = today;
    if (isGetTomorow) {
        if (tomorowDayNum === lastDayNum) {
            ctx.reply('Пробачте. Я можу дати інформацію тільки в рамках цього тижня. З понеділка можна буде перевіряти графіки на наступний день.');
            return;
        }
        dayToRender = schedule.find(day => day['DayNo'] === (tomorowDayNum + 1));
    }

    const date = new Date(data['SearchDate']);
    const title = data['SheduleTitle'];
    const minutes = date.getMinutes() + '';
    const minutesModified = minutes.length === 1 ? `0${date.getMinutes()}` : date.getMinutes();
    const dateToRender = isGetTomorow ? 'Завтра' : 'Сьогодні';
    let scheduleText = isShowJustNoLight ? 'світла не буде:' : 'графік такий:';

    const isScheduleWasChanged = await getIsScheduleWasChanged(schedule);
    const {
        message: messageFromSchedule,
        hasNoLight,
    } = parseSchedule({ dayToRender, isShowJustNoLight });

    scheduleText = hasNoLight ? scheduleText : 'відключень світла не буде.';

    let message = isScheduleWasChanged && !isGetTomorow ? `Змінився графік погодинних відключень! \n` : '';
    message += `${dateToRender} ${scheduleText} \n \n`;
    message += messageFromSchedule;
    message += '\nЯкщо графік зміниться, я повідомлю Вас про це.';

    if (isParseByCron) {
        if (isScheduleWasChanged) {
            ctx.reply(message, buttons);
        }
    } else {
        ctx.reply(message, buttons);
    }

    try {
        await fs.writeFile('./db.json', JSON.stringify(today));
    } catch (e) {
        console.error(`cant write database ${e}`)
    }
};

bot.start((ctx) => ctx.reply('Привіт! Я бот, який підкаже графік погодинних відключень у садовому товаристві "Ятрань".',
    {
        reply_markup: {
            inline_keyboard: [
                [ { text: 'Дізнатися графік на сьогодні', callback_data: 'get' } ],
            ]
        }
    }
    ));

let cronTask = null;

const parse = async ctx => {
    await runParse({ isParseByCron: false, ctx });

    if (!cronTask) {
        const coronSettings = isTest ? '*/1 * * * *' : '*/4 * * * *';
        cronTask = cron.schedule(coronSettings, async () => {
            if (isTest) {
                ctx.reply('cron job is running');
            }
            await runParse({ isParseByCron: true, ctx });
        });
    }
};
bot.command('get', async ctx => {
    await parse(ctx);
});
bot.action('get', async (ctx) => {
    await parse(ctx);
});
bot.action('getTomorow', async ctx => {
    await runParse({ isParseByCron: false, ctx, isGetTomorow: true });
});
bot.command('getTomorow', async ctx => {
    await runParse({ isParseByCron: false, ctx, isGetTomorow: true });
});

const stopWatching = ctx => {
    ctx.reply('Я припиняю слідкувати за змінами у графіках.', {
        reply_markup: {
            inline_keyboard: [
                [ { text: 'Знову почати слідкувати за графіками', callback_data: 'get' } ],
            ]
        }
    });
    if (cronTask) {
        cronTask.stop();
        cronTask = null;
    }
};

bot.action('stop', async (ctx) => {
    stopWatching(ctx);
});
bot.command('stop', async (ctx) => {
    stopWatching(ctx);
});

bot.launch();
console.log('Bot is running.');


