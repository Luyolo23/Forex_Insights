document.addEventListener('DOMContentLoaded', () => {
    let allRates;
    let selectedCurrencies = [];
    let newsPage = 1;

    fetchExchangeRates();
    fetchNews();
    setupConverter();

    function fetchExchangeRates() {
        const cacheKey = 'exchangeRates';
        const cacheExpiry = 30 * 60 * 1000; // Cache expires in 30 minutes
    
        // Check if cached data exists and hasn't expired
        const cachedData = localStorage.getItem(cacheKey);
        const now = Date.now();
        if (cachedData && (now - parseInt(localStorage.getItem(`${cacheKey}Timestamp`))) < cacheExpiry) {
            const { rates } = JSON.parse(cachedData);
            populateCurrencySelects(rates);
            setupCurrencyFilter(rates);
            return; // Return early if cached data is valid
        }
    
        fetch('https://api.exchangerate-api.com/v4/latest/USD')
            .then(response => response.json())
            .then(data => {
                allRates = data.rates;
                populateCurrencySelects(data.rates);
                setupCurrencyFilter(data.rates);
    
                // Cache the rates for future requests
                localStorage.setItem(cacheKey, JSON.stringify(data));
                localStorage.setItem(`${cacheKey}Timestamp`, now);
            });
    }
    
    function fetchNews(page = 1) {
        fetch(`https://cors-anywhere.herokuapp.com/https://newsapi.org/v2/top-headlines?category=business&page=${page}&pageSize=3&apiKey=68e179340d3047f28a8a7b50bd9271e9&language=en`)
            .then(response => response.json())
            .then(data => {
                displayNews(data.articles);
            });
    }

    function displayNews(articles) {
        let output = '';
        articles.forEach(article => {
            output += `
                <div class="col-md-4">
                    <div class="card">
                        <img src="${article.urlToImage}" class="card-img-top" alt="${article.title}" loading="lazy">
                        <div class="card-body">
                            <h5 class="card-title">${article.title}</h5>
                            <p class="card-text">${article.description}</p>
                            <a href="${article.url}" class="btn btn-primary" target="_blank">Read More</a>
                        </div>
                    </div>
                </div>
            `;
        });
        document.getElementById('news-articles').innerHTML = output;
    }

    function setupConverter() {
        document.getElementById('converter-form').addEventListener('submit', function(event) {
            event.preventDefault();
            const amount = parseFloat(document.getElementById('amount').value);
            const fromCurrency = document.getElementById('from-currency').value;
            const toCurrency = document.getElementById('to-currency').value;
    
            if (amount <= 0) {
                alert('Please enter a valid amount greater than 0.');
                return; // Stop the function if amount is not valid
            }
    
            convertCurrency(amount, fromCurrency, toCurrency);
        });
    }

    function convertCurrency(amount, fromCurrency, toCurrency) {
        document.getElementById('conversion-result').innerHTML = '<div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>';
    
        fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`)
            .then(response => response.json())
            .then(data => {
                const rate = data.rates[toCurrency];
                const result = amount * rate;
                document.getElementById('conversion-result').innerHTML = `
                    <h4>${amount} ${fromCurrency} = ${result.toFixed(2)} ${toCurrency}</h4>
                `;
            })
            .catch(error => {
                console.error('Error converting currency:', error);
                document.getElementById('conversion-result').innerHTML = '<p class="text-danger">Conversion failed. Please try again.</p>';
            });
    }

    function populateCurrencySelects(rates) {
        const fromSelect = document.getElementById('from-currency');
        const toSelect = document.getElementById('to-currency');
        const currencies = Object.keys(rates);

        currencies.forEach(currency => {
            const option = document.createElement('option');
            option.value = currency;
            option.text = currency;
            fromSelect.appendChild(option);
            toSelect.appendChild(option.cloneNode(true));
        });
    }

    function setupCurrencyFilter(rates) {
        const filterSelect = document.getElementById('currency-filter');
        const currencies = Object.keys(rates);
        document.getElementById('currency-search').addEventListener('input', function(event) {
            const searchValue = event.target.value.toLowerCase();
            filterSelect.innerHTML = '';
            currencies.forEach(currency => {
                if (currency.toLowerCase().includes(searchValue)) {
                    const option = document.createElement('option');
                    option.value = currency;
                    option.text = currency;
                    filterSelect.appendChild(option);
                }
            });
        });

        filterSelect.addEventListener('change', function(event) {
            const selectedOptions = Array.from(filterSelect.selectedOptions).map(option => option.value);
            if (selectedOptions.length > 4) {
                alert('You can select up to 4 currency pairs only.');
                selectedOptions.pop();
                filterSelect.value = selectedOptions;
            } else {
                selectedCurrencies = selectedOptions;
                displaySelectedCurrencies();
            }
        });
    }
    function displaySelectedCurrencies() {
        let output = '';
        selectedCurrencies.forEach(currency => {
            const rate = allRates[currency]; // Assuming allRates is available globally
            output += `
                <div class="col-md-6 col-lg-3 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${currency} Exchange Rate</h5>
                            <p class="card-text">1 USD = ${rate.toFixed(2)} ${currency}</p>
                            <a href="#" class="btn btn-primary">More Info</a>
                        </div>
                    </div>
                </div>
            `;
        });
        document.getElementById('exchange-rates').innerHTML = output;
    }

    
    
    // function displaySelectedCurrencies() {
    //     let output = '';
    //     selectedCurrencies.forEach(currency => {
    //         output += `
    //             <div class="col-md-4">
    //                 <div class="card">
    //                     <div class="card-body">
    //                         <h5 class="card-title">${currency}</h5>
    //                         <p class="card-text">${allRates[currency]}</p>
    //                     </div>
    //                 </div>
    //             </div>
    //         `;
    //     });
    //     document.getElementById('exchange-rates').innerHTML = output;
    // }

    

    window.filterNews = function(direction) {
        if (direction === 'prev' && newsPage > 1) {
            newsPage--;
        } else if (direction === 'next') {
            newsPage++;
        }
        fetchNews(newsPage);
    }
});
