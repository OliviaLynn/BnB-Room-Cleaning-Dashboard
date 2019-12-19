
function makeRoomSection(dataset, xMonthsAgo) {

	// Select a portion of our dataset
	var originalDataset = dataset;
	var xMonthsAgoSmall = new Date();
	xMonthsAgoSmall.setMonth(xMonthsAgoSmall.getMonth() - 4);
	var filteredDataset = dataset.filter(d => Date.parse(d["Cleaning Time"]) > xMonthsAgoSmall);
	var datasetSmall = filteredDataset;

	// Reorganize our data so each room's entries are gathered together
	function getSum(acc, n) { return parseInt(acc) + parseInt(n); }
	function getRoomData() {
		var rooms = {};
		// Gather the cleanliness ratings for the rooms
		for (var i = 0; i < dataset.length; i++) {
			var room = dataset[i]["Listing"];
			if (room in rooms) {
				rooms[room]["Count"] += 1;
				rooms[room]["Ratings"].push(dataset[i]["Cleanliness"]);
			}
			else {
				rooms[room] = {};
				rooms[room]["Count"] = 1;
				rooms[room]["Ratings"] = [];
				rooms[room]["Ratings"].push(dataset[i]["Cleanliness"]);
			}
		}
		// Calculate average cleanliness
		var roomArr = [];
		for (var room in rooms) {
			rooms[room]["Average"] = rooms[room]["Ratings"].reduce(getSum, 0) / (1.0 * rooms[room]["Count"]);
			rooms[room]["Name"] = room;
			roomArr.push(rooms[room]);
		}
		return roomArr.sort(function(a, b) { return b["Average"] - a["Average"] });
	}
	var roomData = getRoomData();
	var selectedRoom = roomData[0];

	// Constants for our layout
	var barGraphHeight = 300,
		barGraphWidthMax = 800,
		barWidth = barGraphWidthMax / roomData.length - 1,
		barGraphWidth = barWidth * roomData.length, // remove the space that integer division left over
		marginBelowBarGraph = 30;

	var trendGraphWidth = 450,
		trendGraphHeight = 80,
		marginBelowTrendGraph = 60;

	var sliderSvgHeight = 50,
		svgHeight = barGraphHeight + marginBelowBarGraph + trendGraphHeight + marginBelowTrendGraph,
		svgWidth = 800;

	// Grab the DOM, resize our SVG
	var section1 = d3.select("body").select("div, #section1");

	var sliderSvg = d3.select("body").select("#roomSliderSvg");
	sliderSvg
	  .attr("width", 800)
	  .attr("height", sliderSvgHeight);

	var roomSvg = d3.select("body").select("#roomSvg")
	  .attr("width", 800)
	  .attr("height", svgHeight);

	// ------------------------------------------------------------------------
	// 		Date Range:
	// ------------------------------------------------------------------------
	var sliderMargin = {top: 0, left: 0, bottom: 10, right: 0};
	var sliderWidth = svgWidth - sliderMargin.left - sliderMargin.right;
	var sliderHeight = sliderSvgHeight - sliderMargin.top - sliderMargin.bottom;

	var sliderGroup = sliderSvg.append("g")
						.attr("transform", "translate(" + sliderMargin.left + ", " + 
								sliderMargin.top + ")");
	var monthIntervals = [6, 5, 4, 3, 2, 1];
	var selectedInterval = monthIntervals[0];
	var buttonWidth = sliderWidth / monthIntervals.length - 8;

	function getMonthButtonColor(d) {
    	if (selectedInterval == d) {
    		return "#606060";
    	}
    	else {
    		return "#808080";
    	}
	}

	function selectInterval(interval) {
		//Called whenever a button rect or text is clicked

		// Set our current interval to this many months back
		selectedInterval = interval;

		// Update the colors of the month button to reflect new selection
		d3.selectAll(".monthButton").attr("fill", getMonthButtonColor);

		// Calculate new time period as a javascript date object
		var timePeriodStart = new Date();
		timePeriodStart.setMonth(timePeriodStart.getMonth() - selectedInterval);
		
		// Update our globals							
		dataset = originalDataset.filter(d => Date.parse(d["Cleaning Time"]) > timePeriodStart);
		xMonthsAgo = timePeriodStart;
		roomData = getRoomData();

		// Try to maintain our previously selected room, if it exists in our new interval
		//selectedRoom = roomData[0];
		if (!selectedRoom || !roomData.some(room => room["Name"] == selectedRoom["Name"])) {
			selectedRoom = roomData[0];
		}
		
		// Update our graphs
		drawBarsInBarGraph();
		updateSidebarWithNewData();
	    updateTrendGraphWithNewData();
		generateReviewTable();
	}

	var buttons = sliderGroup.selectAll(".monthButton")
					.data(monthIntervals)
					.enter()
						.append("g")
							.attr("transform", function(d, i) {
								return "translate(" + (i * (buttonWidth+8)) + ", 0)"; 
							})

	buttons
		.append("rect")
			.attr("class", "monthButton")
		    .attr("x", function(d, i) {
		    	return 0;//i * (buttonWidth+8);
		    })
		    .attr("y", 0)
		    .attr("width", buttonWidth)
		    .attr("height", sliderHeight)
		    .attr("fill", getMonthButtonColor)
			.on("click", selectInterval);

	buttons
		.append("text")
			.attr("x", 10)
			.attr("y", 10)
			.attr("dominant-baseline", "hanging")
			.style("font-size", 12)
			.style("fill", "white")
			.on("click", selectInterval)
			.text(function(d) { return "Past " + d + " Months"; });

	buttons
		.append("text")
			.attr("x", 10)
			.attr("y", 24)
			.attr("dominant-baseline", "hanging")
			.style("font-size", 10)
			.style("fill", "white")
			.on("click", selectInterval)
			.text(function(interval) {
				var timePeriodStart = new Date();
				timePeriodStart.setMonth(timePeriodStart.getMonth() - interval);
				var count = originalDataset.filter(d => Date.parse(d["Cleaning Time"]) > timePeriodStart).length;
				return count + " entries";
			});

	// ------------------------------------------------------------------------
	// 		Bar Graph:
	// ------------------------------------------------------------------------
	
	// Scales for the bar graph
	var yScale = d3.scaleLinear()
						.domain([5, 1])
						.range([10, barGraphHeight])
						.clamp(true);

    var colorScale = d3.scaleLinear()
    					.domain([3, 5])
      					.interpolate(d3.interpolateHcl)
      					.range([d3.rgb("#ff5555"), d3.rgb('#22aa55')])
						.clamp(true);

	// Add an axis
	var yAxis = d3.axisRight()
					.scale(yScale)
					.ticks(5);

	roomSvg
		.append("g")
			.attr("transform", "translate(" + (barGraphWidth) + ", 0)")
			.call(yAxis);

	// Display bar color based on rating, and make the selected bar a different color
    function getBarColor(d) {
		if (selectedRoom["Name"] == d["Name"]) {
			return "#383030";
		}
		else {
			return colorScale(d["Average"]);
		}    	
    }


	drawBarsInBarGraph();
	function drawBarsInBarGraph() {
		// Draw the bars in our bar graph
		// Can also be called after changing roomData to update the bars

		var bars = roomSvg.selectAll(".roomBar")
							.data(roomData);
		bars
			.exit().remove();

		var barText = roomSvg.selectAll(".barText")
								.data(roomData);
		barText.
			exit().remove();
		
		function selectCurrentBarOnClick(d) {
			// When we click a bar, select that room
			selectedRoom = d;

			// Reset the bar colors
			d3.selectAll(".roomBar").attr("fill", getBarColor);

			// Update our room-specific information
			updateSidebarWithNewData();
		    updateTrendGraphWithNewData();
			generateReviewTable();
		}
		bars
			.enter()
			.append("rect")
				.attr("fill", getBarColor)
				.attr("class", "roomBar")
				.attr("y", function(d) { return yScale(d["Average"]); })
				.attr("x", function(d, i) { return i * barWidth; })
				.attr("height", function(d) { return barGraphHeight - yScale(d["Average"]); })
				.attr("width", barWidth - 1)
				.on("click", selectCurrentBarOnClick)
				.on("mouseover", function(d) {d3.select(this).attr("fill", "#304040")})
				.on("mouseout", function(d) {d3.select(this).attr("fill", getBarColor)});

		bars
			.enter()
			.append("text") // These are the text labels on the bars
				.attr("class", "barText")
				.attr("transform", "rotate(-90)")
			    .style("text-anchor", "beginning")
				.attr("x", 5 - barGraphHeight) // the x and y here are weird bc we're rotated 90!
				.attr("y",  function(d, i) { return -6 + (i+1) * barWidth; })
				.text(function(d) { return d["Name"]; })
				.on("click", selectCurrentBarOnClick)
				.attr("font-size", "10px")
				.attr("fill", "white");

			roomSvg.selectAll(".roomBar")
				.transition()
					.duration(500)
					.attr("fill", getBarColor)
					.attr("height", function(d) { return barGraphHeight - yScale(d["Average"]); })
					.attr("y", function(d) { return yScale(d["Average"]); });
		
			roomSvg.selectAll(".barText")
				.transition()
					.duration(500)
				.text(function(d) { return d["Name"]; });
	}

	// ------------------------------------------------------------------------
	//		Sidebar:
	// ------------------------------------------------------------------------
	
	// Make the "sidebar" - the room title and little details below it
	var sideBar = roomSvg.append("g")
							.attr("transform", "translate(0, " + barGraphHeight + ")");

	sideBar
		.append("text") // Room name
			.attr("transform", "translate(0, 50)")
			.attr("id", "selectedRoomTitle")
			.text(selectedRoom["Name"])
			.attr("font-size", "32px")
			.style("font-weight", "normal")
			.attr("fill", "black");

	function getAverageDisplayText() {
		return "" + (Math.round(selectedRoom["Average"]*100) / 100.0);
	}
	sideBar
		.append("text") // "Average:"
			.attr("transform", "translate(0, 90)")
			.text("Average:")
			.attr("font-size", "14px")
			.attr("fill", "black");
	sideBar
		.append("text") // (Average)
			.attr("transform", "translate(60, 90)")
			.attr("id", "selectedRoomAverage")
			.text(getAverageDisplayText())
			.attr("font-size", "24px")
			.style("font-weight", "bold")
			.attr("fill", colorScale(selectedRoom["Average"]));
		
	function getReviewCountDisplayText() {
		return "" + selectedRoom["Count"];
	}
	sideBar
		.append("text") // "of"
			.attr("transform", "translate(0, 110)")
			.text("(of")
			.attr("font-size", "14px")
			.attr("fill", "black");
	sideBar
		.append("text")  // (Count)
			.attr("transform", "translate(22, 110)")
			.attr("id", "selectedRoomReviewCount")
			.text(getReviewCountDisplayText())
			.attr("font-size", "14px")
			.style("font-weight", "bold")
			.attr("fill",  colorScale(selectedRoom["Average"]));
	function getReviewOffset() {
		// if the count is a 2 digit word, we need to make room for
		// the second digit before placing the "reviews" text
		return selectedRoom["Count"] >= 10 ? 7 : 0;
	}
	sideBar
		.append("text")  // "reviews"
			.attr("transform", "translate(35, 110)")
			.attr("id", "selectedRoomReviewOffset")
			.text("reviews)")
			.attr("x", getReviewOffset())
			.attr("font-size", "14px")
			.attr("fill", "black");

	function updateSidebarWithNewData() {
		if (selectedRoom) {
			d3.select("#selectedRoomTitle").text(selectedRoom["Name"]);
			d3.select("#selectedRoomAverage").text(getAverageDisplayText())
												.attr("fill",  colorScale(selectedRoom["Average"]));
			d3.select("#selectedRoomReviewCount").text(getReviewCountDisplayText())
													.attr("fill",  colorScale(selectedRoom["Average"]));
			d3.select("#selectedRoomReviewOffset").attr("x", getReviewOffset());
		}
		else { // if we have no currently selected room
			d3.select("#selectedRoomTitle").text("N/A");
			d3.select("#selectedRoomAverage").text("-")
												.attr("fill",  colorScale(0));
			d3.select("#selectedRoomReviewCount").text("-")
												.attr("fill",  colorScale(0));
			d3.select("#selectedRoomReviewOffset").attr("x", 0);
		}
	}	

	// ------------------------------------------------------------------------
	// 		Trend Graph:
	// ------------------------------------------------------------------------
	// The current room's "trend graph" of ratings over time

	// A group to store the translation that gets us to the "origin" of our trendGraph
	var trendGraph = roomSvg
		.append("g")
			.attr("id", "trendGraph")
			.attr("transform", "translate(" + (barGraphWidth - trendGraphWidth) + "," + (marginBelowBarGraph + barGraphHeight) +")");

	// Scales
	var timeScale = d3.scaleTime()
					    .domain([xMonthsAgo, Date.now()])
					    .range([0, trendGraphWidth]);

	var ratingScale = d3.scaleLinear()
						    .domain([1, 5]) 
						    .range([trendGraphHeight, 0]); 

	var selectedColorScale = d3.scaleLinear()
								.domain([1, 5])
	  							.interpolate(d3.interpolateHcl)
	 							.range([d3.rgb("#ff5555"), d3.rgb('#22aa55')]);

	// Call the x axis in a group tag
	trendGraph
		.append("g")
		    .attr("class", "trend-x-axis")
		    .attr("transform", "translate(0," + trendGraphHeight + ")")
		    .call(d3.axisBottom(timeScale).ticks(4)); // Create an axis component with d3.axisBottom

	// Call the y axis in a group tag
	trendGraph
		.append("g")
		    .attr("class", "trend-y-axis")
		    .call(d3.axisLeft(ratingScale).ticks(5)); // Create an axis component with d3.axisLeft

	// Add the data to the graph
	updateTrendGraphWithNewData();

	function updateTrendGraphWithNewData() {

		// Update the x-axis in case the time interval has been changed
		timeScale = d3.scaleTime()
					    .domain([xMonthsAgo, Date.now()])
					    .range([0, trendGraphWidth]);
		d3.selectAll(".trend-x-axis").remove();
		trendGraph
			.append("g")
			    .attr("class", "trend-x-axis")
			    .attr("transform", "translate(0," + trendGraphHeight + ")")
			    .call(d3.axisBottom(timeScale).ticks(4)); // Create an axis component with d3.axisBottom


		// Lines
		var trendGraphLine = roomSvg.select("#trendGraph")
									.selectAll(".trendLine")
								    .data([getReviewsOfCurrentRoom()]);

		trendGraphLine
		    .enter()
		    .append("path")
			    .attr("class","trendLine")
			    .merge(trendGraphLine)
			    .transition()
			    .duration(500)
			    .attr("d", d3.line()
						      .x(function(d) { return timeScale(Date.parse(d["Cleaning Time"])); })
						      .y(function(d) { return ratingScale(d["Cleanliness"]); }))
								    .attr("fill", "none")
								    .attr("stroke", "black")
								    .attr("stroke-width", 1)
								    .style("stroke-dasharray", ("3, 3"))
								    .attr("opacity", 0.6);

		// Dots
		var trendGraphDots = roomSvg.select("#trendGraph")
									.selectAll(".dot")
									.data(getReviewsOfCurrentRoom());

		trendGraphDots
			.exit()
			.remove();

		trendGraphDots
			.enter()
			.append("circle") // Uses the enter().append() method
			    .attr("class", "dot") // Assign a class for styling
			    .attr("cx", function(d) { return timeScale(Date.parse(d["Cleaning Time"])); })
			    .attr("cy", function(d) { return ratingScale(d["Cleanliness"]); })
			    .attr("fill", function(d) {return selectedColorScale(d["Cleanliness"] ); })
			    .attr("opacity", 1)
			    .attr("r", 0);

		roomSvg.selectAll(".dot")
			.transition() // Uses the enter().append() method
				.duration(500)
			    .attr("cx", function(d) { return timeScale(Date.parse(d["Cleaning Time"])); })
			    .attr("cy", function(d) { return ratingScale(d["Cleanliness"]); })
			    .attr("fill", function(d) {return selectedColorScale(d["Cleanliness"]); })
			    .attr("r", 5);
	}

	// ------------------------------------------------------------------------
	//		Table of Reviews:
	// ------------------------------------------------------------------------
	
	// Sort our data, because they are only mostly in order by cleaning time
	function sortByCleaningTime(a, b) {
		return Date.parse(b["Cleaning Time"]) - Date.parse(a["Cleaning Time"]);
	}

	function getReviewsOfCurrentRoom() {
		var reviews = dataset.filter(review => review["Listing"] == selectedRoom["Name"]);
		return reviews.sort(sortByCleaningTime);
	}
	
	generateReviewTable();

	function generateReviewTable() {
		d3.select("#table1")
				.selectAll("tr").remove();

		var rows = d3.select("#table1")
					.selectAll("tr")
					.data(getReviewsOfCurrentRoom())
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
									row["Cleaner"],
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
	
}
