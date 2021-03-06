<script context="module">
    import { getPreloadApiResponse } from "utils/requests";

    export async function preload(page, session) {
        const devices = await getPreloadApiResponse(
            `/api/devices/getReadouts`,
            {
                page: page.params.page,
            },
            this
        );

        return {
            devices,
        };
    }
</script>

<script>
    import { getContext } from "svelte";
    import { format, register } from "timeago.js";
    import Device from "components/DeviceInfo.svelte";

    export let devices = [];

    let socket;
    let mutableDevices = [];
    const socketStore = getContext("socket");
    const singleDatesArray = [
        "только что",
        "минуту",
        "час",
        "день",
        "неделю",
        "месяц",
        "год",
    ];
    const multipleDatesArray = [
        ["секунду", "секунды", "секунд"],
        ["минуту", "минуты", "минут"],
        ["час", "часа", "часов"],
        ["день", "дня", "дней"],
        ["неделю", "недели", "недель"],
        ["месяц", "месяца", "месяцев"],
        ["год", "года", "лет"],
    ];
    const ruLocale = (number, index, totalSec) => {
        totalSec = parseInt(totalSec, 10);
        const resultIndex = parseInt(index / 2, 10);

        if (index % 2 === 0) {
            if (index === 0) {
                return ["только что", "сейчас"];
            } else {
                return [
                    `${singleDatesArray[resultIndex]} назад`,
                    `через ${singleDatesArray[resultIndex]}`,
                ];
            }
        } else {
            let numberIndex;

            if (number > 10 && number < 20) {
                numberIndex = 2;
            } else {
                const remainder = number % 10;

                if (remainder === 1) {
                    numberIndex = 0;
                } else if (remainder > 1 && remainder < 5) {
                    numberIndex = 1;
                } else {
                    numberIndex = 2;
                }
            }

            return [
                `%s ${multipleDatesArray[resultIndex][numberIndex]} назад`,
                `через %s ${multipleDatesArray[resultIndex][numberIndex]}`,
            ];
        }
    };
    const ru_RU = {
        decimal: ",",
        thousands: "\xa0",
        grouping: [3],
        currency: ["", " руб."],
        dateTime: "%A, %e %B %Y г. %X",
        date: "%d.%m.%Y",
        time: "%H:%M:%S",
        periods: ["AM", "PM"],
        days: [
            "воскресенье",
            "понедельник",
            "вторник",
            "среда",
            "четверг",
            "пятница",
            "суббота",
        ],
        shortDays: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
        months: [
            "Январь",
            "Февраль",
            "Март",
            "Апрель",
            "Май",
            "Июнь",
            "Июль",
            "Август",
            "Сентябрь",
            "Октябрь",
            "Ноябрь",
            "Декабрь",
        ],
        shortMonths: [
            "Янв",
            "Фев",
            "Мар",
            "Апр",
            "Май",
            "Июн",
            "Июл",
            "Авг",
            "Сен",
            "Окт",
            "Ноя",
            "Дек",
        ],
    };

    register("ru", ruLocale);

    socketStore.subscribe((freshSocket) => {
        if (freshSocket) {
            socket = freshSocket;

            socket.on("newReadouts", (details) => {
                for (const device of devices) {
                    if (device.id === details.deviceId) {
                        device.lastRecord = details.lastRecord;
                        device.date = new Date();
                        device.active = true;

                        return;
                    }
                }
            });
        }
    });

    $: {
        const devicesIds = [];

        for (let i = 0; i < devices.length; i += 1) {
            devicesIds.push(devices[i].id);
            devices[i].active = devices[i].hasOwnProperty("lastRecord");

            if (!devices[i].hasOwnProperty("date") && devices[i].active) {
                devices[i].date = new Date(
                    parseInt(devices[i].timeStamp.substring(0, 4), 10),
                    parseInt(devices[i].timeStamp.substring(5, 7), 10) - 1,
                    parseInt(devices[i].timeStamp.substring(8, 10), 10),
                    parseInt(devices[i].timeStamp.substring(11, 13), 10),
                    parseInt(devices[i].timeStamp.substring(14, 16), 10),
                    parseInt(devices[i].timeStamp.substring(17, 19), 10),
                    parseInt(devices[i].timeStamp.substring(20, 23), 10)
                );

                devices[i].date.setTime(
                    devices[i].date.getTime() -
                        devices[i].date.getTimezoneOffset() * 60000
                );
            }
        }

        if (socket) {
            socket.emit("newDevices", devicesIds);
        }
    }

    setInterval(() => (mutableDevices = devices), 1000);
</script>

{#if devices.length > 0}
    {#each mutableDevices as device (device.id)}
        <Device {device} {format} locale={ru_RU} />
    {/each}
{:else}Произошла какая-то досадная оплошность. Агась.{/if}

<style lang="scss">
</style>
