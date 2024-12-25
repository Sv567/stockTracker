const apiKey = '2MMLCQCNXO4WZPEA'; // MYTSHCNKZD9XM6NK
const stockDropdown = document.getElementById('stockDropdown');
const loadStockButton = document.getElementById('loadStockButton');
const stockDetails = document.getElementById('stockDetails');
const stockTable = document.getElementById('stockTable').getElementsByTagName('tbody')[0];

const searchButton = document.getElementById('searchStockButton')
const inputText = document.getElementById('inputText');


const ctx = document.getElementById('stockChart').getContext('2d');
let stockChart;

const stockArr = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'FB', 'NFLX', 'NVDA', 'BABA', 'INTC'];

function populateDropdown() {
    stockArr.forEach(stock => {
        const option = document.createElement('option');
        option.value = stock;
        option.text = stock;
        stockDropdown.appendChild(option);
    });
}

async function getStockData(stockSymbol) {

    const cachedData = localStorage.getItem(stockSymbol); 
    const cacheExpiration = 60 * 60 * 1000; 

    if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        const currentTime = new Date().getTime();

        if (currentTime - parsedData.timestamp < cacheExpiration) {
            console.log('Using cached data');
            return parsedData.data; 
        } else {
            console.log('Cache expired');
            localStorage.removeItem(stockSymbol); 
        }
    }
    try {
        const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stockSymbol}&apikey=${apiKey}`);

        const data = await response.json();

        if (response.ok) {
            if (data['Time Series (Daily)']) {
                return data['Time Series (Daily)'];
            } else if (data['Error Message']) {
                console.log('Error Message from API:', data['Error Message']);
                throw new Error('Invalid stock symbol.');
            } else if (data['Note']) {
                console.log('API Note:', data['Note']);
                throw new Error('API rate limit exceeded.');
            } else {
                console.log('Unexpected data format:', data);
                throw new Error('Unexpected response format.');
            }
        } else {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
    } catch (error) {
        console.log('Error fetching stock data:', error.message);
        return null;
    }
}


function displayStockDetails(stockData, symbol) {
    // console.log('stockData', stockData);

    const dates = Object.keys(stockData);
    const latestDate = dates[0];
    const previousDate = dates[1];
    const latestData = stockData[latestDate];
    const previousData = stockData[previousDate];

    const price = parseFloat(latestData['4. close']).toFixed(2);
    const volume = parseInt(latestData['5. volume']).toLocaleString();
    const change = (parseFloat(latestData['4. close']) - parseFloat(previousData['4. close'])).toFixed(2);
    const changePercentage = ((change / previousData['4. close']) * 100).toFixed(2);

    stockDetails.innerHTML = `
        <h2>${symbol}</h2>
        <p>Price: $${price}</p>
        <p>Change: $${change} (${changePercentage}%)</p>
        <p>Volume: ${volume}</p>
    `;

    updateStockTable(symbol, price, change, volume);
}

function updateStockTable(symbol, price, change, volume) {
    const newRow = stockTable.insertRow();
    newRow.innerHTML = `
        <td>${symbol}</td>
        <td>$${price}</td>
        <td>${change}</td>
        <td>${volume}</td>
    `;
}

function displayStockGraph(stockData) {
    const dates = Object.keys(stockData).slice(0, 30).reverse();
    const closingPrices = dates.map(date => parseFloat(stockData[date]['4. close']));

    if (stockChart) {
        stockChart.destroy();
    }

    stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Closing Price',
                data: closingPrices,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Stock Closing Prices (Last 30 Days)'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Price (USD)'
                    }
                }
            }
        }
    });
}

searchButton.addEventListener('click',()=>{
let selectedStock = inputText.value.trim();
// console.log('click', selectedStock)

if(selectedStock){
    const stockData = getStockData(selectedStock);
    
    // console.log('stockData',stockData)
    if(stockData){
        displayStockDetails(stockData, selectedStock);
        displayStockGraph(stockData)
    }else{
        stockDetails.innerHTML = `<p>Data not available for ${stockSymbol}.</p>`;

    }
}else{
    alert('Please enter a stock symbol.');
}

})
loadStockButton.addEventListener('click', async () => {
    const selectedStock = stockDropdown.value;
    if (selectedStock) {
        const stockData = await getStockData(selectedStock);
        if (stockData) {
            displayStockDetails(stockData, selectedStock);
            displayStockGraph(stockData);
        } 
        else {
            stockDetails.innerHTML =  `<p>Data not available for ${selectedStock}.</p>`
        }
        console.log(selectedStock)
    } else {
        alert('Please select a stock symbol.');
    }
});



populateDropdown();