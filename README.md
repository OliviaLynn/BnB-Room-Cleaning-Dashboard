# BnB Room Cleaning Dashboard
<img src="https://img.shields.io/badge/browser-chrome-blue" /> <img src="https://img.shields.io/badge/d3js-5.12.0-blue" /> <img src="https://img.shields.io/badge/maintained%3F-no-red" /> <img src="https://img.shields.io/github/issues/OliviaLynn/BnB-Room-Cleaning-Dashboard" /> 

An interactive dashboard for monitoring and improving BnB room cleanliness, as well as incentivizing and applauding excellent performances by our lovely cleaners.


This needs to be hosted locally!

From your command prompt, cd into this directory and run:
	python -m http.server 8000

Then type "localhost:8000" into the url bar of your browser to view
	
I'm using Chrome - you can use other browsers, but the spacing will
	be off. Adjusting for other browsers is on the to-do, but not quite yet
	

## Getting Started

These instructions will get the project up and running on your own machine with your own Smartbnb account.

### Prerequisites

#### Selenium (1.141.0)
Our webscraper. Instructions assume you use Chrome, but you can substitute your preferred (selenium-supported) browser instead.
- Install selenium via pip
```shell
pip install selenium
```
- Check what version of Chrome you're using (Chrome menu in the top right > Help > About Google Chrome)
- The Selenium Chromedriver for your version of Chrome can be downloaded [here](https://chromedriver.chromium.org/downloads) (the one in this git is for version 78). Place this exe in the same directory as SmartbnbScraper.py

#### Beautiful Soup (4.7.1)
For parsing the html we scrape.
```shell
pip install beautifulsoup4
```

### Running
From your shell, run the command:
```shell
$ python SmartbnbScraper.py <smartbnb-username> <smartbnb-password>
```
