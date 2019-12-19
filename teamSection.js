function makeTeamSection(dataset, xMonthsAgo) {
	// Reorganize our data for each cleaner
	function getSum(acc, n) { return parseInt(acc) + parseInt(n); }
	function getCleanerData() {
		var cleaners = {};

		// Gather the cleanliness ratings per cleaner
		for (var i = 0; i < dataset.length; i++) {
			var cleaner = dataset[i]["Cleaner"].trim();
			if (cleaner in cleaners) {
				cleaners[cleaner]["Count"] += 1;
				cleaners[cleaner]["Ratings"].push(dataset[i]["Cleanliness"]);
			}
			else {
				cleaners[cleaner] = {};
				cleaners[cleaner]["Count"] = 1;
				cleaners[cleaner]["Ratings"] = [];
				cleaners[cleaner]["Ratings"].push(dataset[i]["Cleanliness"]);
			}
		}

		// Calculate mean, ans also bins for histogram
		var cleanerArray = [];
		for (var cleaner in cleaners) {
			// Sort
			cleaners[cleaner]["Ratings"].sort(function(a, b) {return a-b;})
			// Get mean
			cleaners[cleaner]["Mean"] = cleaners[cleaner]["Ratings"].reduce(getSum, 0) / (1.0 * cleaners[cleaner]["Count"]);
			// Calculate bins
			// Note that bins[0] will hold the # of 1 star ratings, bins[1] the # of 2 star ratings, etc
			// We're iterating i from 1 to 5 here though, to match with the rating r
			cleaners[cleaner]["Bins"] = [];
			for (var i = 1; i < 6; i++) {
				var binCount = cleaners[cleaner]["Ratings"].filter(r => r == i).length;
				cleaners[cleaner]["Bins"].push(binCount)
			}
			// Record cleaner's name
			cleaners[cleaner]["Name"] = cleaner;
			// Store data
			cleanerArray.push(cleaners[cleaner]);
		}
		return cleanerArray.sort(function(a, b) { return b["Count"] - a["Count"]; });
	}

	function getMaxBinCount() {
		var maxBinCount = 0;
		var cleanerData = getCleanerData();
		for (var i = 0; i < cleanerData.length; i++) {
			var localMax = Math.max(...cleanerData[i]["Bins"]);
			if (localMax > maxBinCount) {
				maxBinCount = localMax;
			}
		}
		return maxBinCount;
	}

	var selectedCleaner;
	if (getCleanerData().length > 0) {
		selectedCleaner = getCleanerData()[0];
	}
	else {
		selectedCleaner = {
			Name: "",
			Count: 0,
			Mean: 0,
			Bins: [],
			Ratings: []
		}
	}

	function cleanerCardMaker(cleanerData) {
		// Drawing the bars
		var barWidth = 18;
		var mainColor = "#2080b0";

		// set the dimensions and margins of the graph
		var margin = {top: 10, right: 10, bottom: 50, left: 10},
		    width = barWidth*5,
		    height = 120;

		// append the svg object to the body of the page
		var card = d3.select("#cleaner-card-area")
						.append("svg")
						    .attr("width", width + margin.left + margin.right)
						    .attr("height", height + margin.top + margin.bottom)
						    .attr("class", "cleaner-card")
						    .attr("id", cleanerData["Name"] + "-card");
		card
			.append("rect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("width", width + margin.left + margin.right)
			    .attr("height", height + margin.top + margin.bottom)
			    .attr("fill", "none")
			    .attr("id", cleanerData["Name"] + "-selection-border")
			    .attr("stroke", function() {
			    	if (selectedCleaner["Name"] == cleanerData["Name"]) {
			    		return "black";
			    	}
			    	else {
			    		return "none";
			    	}
			    });

		// Scales for our histogram
		var yScale = d3.scaleLinear()
						.domain([0, getMaxBinCount()])
						.range([0, height]);

	    var colorScale = d3.scaleLinear()
	    					.domain([1, 5])
	      					.interpolate(d3.interpolateHcl)
	      					.range([d3.rgb("#ff5540"), d3.rgb('#2090a0')]);

		// Start our histogram
		var histogram = card
							.append("g")
						    .attr("transform",
						          "translate(" + margin.left + "," + margin.top + ")")
							.on("click", function() {
								selectCleaner(cleanerData);
							});

		// Make histogram bars
		var histogramBG = histogram
							.append("rect")
								.attr("fill", "#f4f4f0")
								.attr("x", 0)
								.attr("y", 0)
								.attr("width", width)
								.attr("height", height);

		var barGroups = histogram.selectAll("rect")
							.data(cleanerData["Bins"])
								.enter()
								.append("g");

		var bars = barGroups
			.append("rect")
				.attr("fill", function(d, i) {
					return colorScale(i+1); //+1 because indices are 0-4, but ratings are 1-5
				})
				.attr("y", function(d) { return height - yScale(d); })
				.attr("x", function(d, i) { return i * barWidth; })
				.attr("height", function(d) { return yScale(d); })
				.attr("width", barWidth-1);

		// Write name
		var cleanerName = histogram //d3.select("#" + cleanerData["Name"] + "-card")
							.append("text")
								.attr("x", 0)
								.attr("y", height + 10)
								.style("font-size", 18)
								.text(cleanerData["Name"])
								.attr("dominant-baseline", "hanging")
								.style("fill", "#202020");
		// Write count
		var ratingsText = histogram 
							.append("text")
								.attr("x", width)
								.attr("y", height + 33)
								.style("font-size", 12)
								.text("cleanings")
								.attr("dominant-baseline", "hanging")
								.attr("text-anchor", "end")
								.style("fill", "#202020");
		var ratingsCount = histogram 
							.append("text")
								.attr("x", width - 54)
								.attr("y", height + 33)
								.style("font-size", 12)
								.text(cleanerData["Count"])
								.attr("dominant-baseline", "hanging")
								.attr("text-anchor", "end")
								.style("font-weight", "bold")
								.style("fill", mainColor);
	}
	function generateCleanerCards() {
		var cleanerData = getCleanerData();
		for (var i = 0; i < cleanerData.length; i++) {
			cleanerCardMaker(cleanerData[i]);
		}
	}
	generateCleanerCards();

	function selectCleaner(cleanerData) {
		// Remove the border around the currently selected cleaner
		d3.select("#" + selectedCleaner["Name"] + "-selection-border")
		    .attr("stroke", "none");

		// Update to the newly selected cleaner
		selectedCleaner = cleanerData;

		// Add a border to the newly selected cleaner
		d3.select("#" + selectedCleaner["Name"] + "-selection-border")
		    .attr("stroke", "black");

		// Update our detailed information views
		makeCleanerSidebar();
		generateReviewTable();
	}


	// ------------------------------------------------------------------------
	//		Cleaner Sidebar:
	// ------------------------------------------------------------------------

	function makeCleanerSidebar() {
		var cleanerTitle = d3.select("#cleaner-title")
							.text(selectedCleaner["Name"]);
		var cleanerCount = d3.select("#cleaner-count")
							.text(selectedCleaner["Count"]);
		var options = { year: 'numeric', 
						month: 'short', 
						day: 'numeric' };
		var startDateString = xMonthsAgo.toLocaleDateString("en-US", options);
		var cleanerStartDate = d3.select("#cleaner-start-date")
									.text(startDateString);
	}
	makeCleanerSidebar();

	// ------------------------------------------------------------------------
	//		Table of Reviews:
	// ------------------------------------------------------------------------

	// Sort our data, because they are only mostly in order by cleaning time
	function sortByCleaningTime(a, b) {
		return Date.parse(b["Cleaning Time"]) - Date.parse(a["Cleaning Time"]);
	}

	// Get specific reviews
	function getReviewsForCurrentCleaner() {
		var reviews = dataset.filter(review => review["Cleaner"] == selectedCleaner["Name"]);
		return reviews.sort(sortByCleaningTime);
	}

	// Generate the table
	//var reviewsOfCurrentCleaner = getReviewsForCurrentCleaner()
	function generateReviewTable() {
		d3.select("#table2")
				.selectAll("tr").remove();

		var rows = d3.select("#table2")
					.selectAll("tr")
					.data(getReviewsForCurrentCleaner())
					.enter().append("tr")
						.selectAll("td")
						.data(function(row, i) {
							var cleaningDate = new Date(Date.parse(row["Cleaning Time"]));
							var options = { 
								year: '2-digit', 
								month: 'short', 
								day: 'numeric', 
								hour: 'numeric', 
								minute: 'numeric' };
							var cleaningDateString = cleaningDate.toLocaleDateString("en-US", options);
							return [row["Cleanliness"],
									cleaningDateString, 
									row["Listing"],
									row["Cleanliness Comments"]];
						}).enter().append("td")
							.text(function(d) {return d;})

		
		// Reset collapsible container height to accomodate new data
		var coll = document.getElementsByClassName("collapsible");
		for (var i = 0; i < coll.length; i++) {
		    var content = coll[i].nextElementSibling;
		    if (content.style.maxHeight){
		      content.style.maxHeight = content.scrollHeight + "px";
		    }
		}
		
	}
	generateReviewTable();

}