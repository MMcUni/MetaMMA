var request = require("request");
var cheerio = require("cheerio");
var fs = require("fs");

var eventStats = [];
var eventLinks = [];
var eventCount = 0;

console.log("Starting scrape at", new Date().toISOString());

function getEventStats() {
  try {
    console.log("Reading eventLinks.txt file...");
    const fileContent = fs.readFileSync("eventLinks.txt", "utf8");
    eventLinks = fileContent.split("\n").filter((link) => link.trim() !== "");
    console.log(`Found ${eventLinks.length} event links in total.`);
    console.log(`Processing all ${eventLinks.length} events.`);

    if (eventCount < eventLinks.length) {
      processEventPage(getEventStats);
    } else {
      console.log(`Attempting to save ${eventStats.length} events to file...`);
      fs.writeFile(
        "eventStats.json",
        JSON.stringify(eventStats, null, 4),
        "utf8",
        (err) => {
          if (err) {
            console.error("Error writing to file:", err);
          } else {
            console.log(
              `Successfully saved data for ${eventStats.length} events to eventStats.json`
            );
          }
          process.exit(0);
        }
      );
    }
  } catch (error) {
    console.error("Error reading file:", error);
    process.exit(1);
  }
}

function processEventPage(callback) {
  const currentLink = eventLinks[eventCount];
  console.log(
    `\nProcessing event ${eventCount + 1}/${eventLinks.length}: ${currentLink}`
  );

  request(currentLink, function (error, response, body) {
    if (error) {
      console.error(`Error fetching ${currentLink}:`, error);
      eventCount++;
      setTimeout(callback, 1000);
      return;
    }
    if (response.statusCode !== 200) {
      console.error(
        `Received status code ${response.statusCode} for ${currentLink}`
      );
      eventCount++;
      setTimeout(callback, 1000);
      return;
    }
    try {
      const $ = cheerio.load(body);
      const eventTitle = $("h1 span[itemprop='name']").text().trim();
      console.log("Event:", eventTitle);

      const eventDate =
        $("meta[itemprop='startDate']").attr("content")?.split("T")[0] || "N/A";
      const isFutureEvent = new Date(eventDate) > new Date();

      const eventDetails = {
        event: eventTitle,
        organization: $("div.organization span[itemprop='name']").text().trim(),
        date: eventDate,
        time:
          $("meta[itemprop='startDate']").attr("content")?.split("T")[1] ||
          "N/A",
        location: $("span[itemprop='location']").text().trim(),
        isFutureEvent: isFutureEvent,
        fights: [],
      };

      console.log(`Event details: ${JSON.stringify(eventDetails, null, 2)}`);

      if (isFutureEvent) {
        console.log(
          "This is a future event. No fight information available yet."
        );
        eventStats.push(eventDetails);
        eventCount++;
        setTimeout(callback, 1000);
        return;
      }

      // Process all fights
      $(".new_table.result tr:not(.table_head)").each(function (index) {
        const isMainEvent = index === 0;
        const fight = {
          main: isMainEvent,
          match: parseInt($(this).find("td").first().text().trim()) || null,
          winner: $(this)
            .find("td.text_right a span[itemprop='name']")
            .text()
            .trim(),
          loser: $(this)
            .find("td.text_left a span[itemprop='name']")
            .text()
            .trim(),
          weight_class: $(this)
            .find("td.text_center span.weight_class")
            .text()
            .trim(),
          method: $(this).find("td.winby b").text().trim(),
          referee: $(this).find("td.winby span.sub_line").text().trim(),
          round: parseInt($(this).find("td").eq(-2).text().trim()) || null,
          time: $(this).find("td").last().text().trim(),
        };
        eventDetails.fights.push(fight);
        console.log(
          `Processed fight ${index + 1}: ${JSON.stringify(fight, null, 2)}`
        );
      });

      if (eventDetails.fights.length === 0) {
        console.log(
          "No fights found on this page. HTML structure might have changed."
        );
        console.log(
          "Table classes found:",
          $("table")
            .map((i, el) => $(el).attr("class"))
            .get()
        );
      }

      eventStats.push(eventDetails);
      console.log(
        `Processed ${eventDetails.fights.length} fights for ${eventTitle}`
      );
    } catch (error) {
      console.error(`Error processing ${currentLink}:`, error);
    }
    eventCount++;
    console.log(`Completed ${eventCount} out of ${eventLinks.length} events`);
    // Add a small delay before processing the next event to be considerate to the server
    setTimeout(callback, 1000);
  });
}

process.on("exit", (code) => {
  console.log(
    `Scraping process exited with code ${code} at ${new Date().toISOString()}`
  );
  const totalEvents = eventStats.length;
  const futureEvents = eventStats.filter((e) => e.isFutureEvent).length;
  const eventsWithFights = eventStats.filter((e) => e.fights.length > 0).length;
  console.log(`Total events processed: ${totalEvents}`);
  console.log(`Future events (no fight data): ${futureEvents}`);
  console.log(`Events with fight data: ${eventsWithFights}`);
  console.log(
    `Total fights scraped: ${eventStats.reduce(
      (sum, event) => sum + event.fights.length,
      0
    )}`
  );
});

// Start the scraping process
getEventStats();
