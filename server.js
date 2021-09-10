import { WebSocketServer } from "ws";
import axios from "axios";

const PORT = process.env.PORT || 5000;

const server = new WebSocketServer({ port: PORT });

const checkAvailableNumber = async (city, percent, number) => {
    const numberUrl = `https://${city.code}.beeline.ru/fancynumber/favourite/?number=${number}`;
    const numbers = [];

    await axios.get(numberUrl).then((res) => {
        res.data.numbers.forEach((category) => {
            category.numbers.forEach((currentNumber) => {
                if (currentNumber.value.includes(number)) {
                    numbers.push(currentNumber);
                }
            });
        });
    });

    return {
        percent,
        city,
        numbers,
    };
};

const fetchCities = async () => {
    const data = new Map();
    const regionsUrl =
        "https://moskva.beeline.ru/region/regionsList/?ui-culture=ru-ru";

    await axios
        .post(regionsUrl, { clearJson: "true" })
        .then((res) => {
            return res.data.allRegionGroups;
        })
        .then((regionGroups) => {
            regionGroups.forEach((region) => {
                region.forEach(({ items }) => {
                    items.forEach((city) => {
                        data.set(city.code, city);
                    });
                });
            });
        });

    return Array.from(data.values());
};

server.on("connection", async (ws) => {
    const cities = await fetchCities();

    ws.send("Добро пожаловать");

    ws.on("message", async (message) => {
        const { payload: number } = JSON.parse(message.toString());

        console.log(number);

        let i = 0;
        for (let city of cities) {
            i++;
            const percent = Math.ceil((i / cities.length) * 100);
            const res = await checkAvailableNumber(city, percent, number);
            ws.send(JSON.stringify(res));
        }
    });
});
