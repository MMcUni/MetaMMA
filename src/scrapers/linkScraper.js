var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var baseUrl = "https://www.sherdog.com";
var eventLinks = [];
var pageCount = 1;

function getEventLinks() {
    var url = `https://www.sherdog.com/organizations/Ultimate-Fighting-Championship-UFC-2/recent-events/${pageCount}`;
    console.log(`Scraping page ${pageCount}: ${url}`);

    request(url, function (error, response, body) {
        if (error) {
            console.error("Error fetching page:", error);
            return;
        }
        if (response.statusCode !== 200) {
            console.error(`Received status code ${response.statusCode}`);
            return;
        }

        var $ = cheerio.load(body);
        var links = $("tr[itemtype='http://schema.org/Event']");
        var newLinks = 0;

        links.each(function (index) {
            var link = baseUrl + $(this).find("a[itemprop='url']").attr("href");
            if (!eventLinks.includes(link)) {
                eventLinks.push(link);
                newLinks++;
            }
        });

        console.log(`Found ${newLinks} new event links on page ${pageCount}`);

        if (newLinks > 0) {
            pageCount++;
            getEventLinks(); // Recursively call to scrape next page
        } else {
            console.log("No more new links found. Scraping complete.");
            saveEventLinks();
        }
    });
}

function saveEventLinks() {
    fs.writeFile('eventLinks.txt', eventLinks.join('\n'), 'utf8', function (err) {
        if (err) {
            console.error("Error writing to file:", err);
        } else {
            console.log(`Saved ${eventLinks.length} event links to eventLinks.txt`);
        }
    });
}

// Start the scraping process
getEventLinks();