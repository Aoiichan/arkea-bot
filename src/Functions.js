import fetch from 'isomorphic-fetch'
import config from './config.json';
import lomat from './lomat.json'


function getChannelsFromConfig(bot){
	let channels = config.channels;
	let tmp = [];
	Object.keys(channels).forEach(channel => {
		tmp.push(bot.guilds.get(channels[channel]).channels.get(channel))
	});
	return tmp;
}

//fetch menu asynchronously
async function getMenuFromArkea(UrlJSON, day, ...other){
	let data = await fetch(UrlJSON)
		.then((response) => {
		    if (response.status >= 400) {
		        throw new Error("Bad response from server");
		    }
		    return response.json();
		})
		.catch((e) => console.log(e))

	// Find object for right day and store it to variable cut.
	try {
		var cut = data.Days.find((obj) => (obj.Date === day)).Meals;
	}
	catch (e) {
		console.log(e);
	}

	//Main meal
	let MainMeal = cut[0].Name.replace('Uunimakkara', 'UUUNIMAKKAARAAAAOUUUUYHJEAAAAHBOYYYYYYY') + "\n";

	//Vegetarian
	let SecondMeal = cut[1].Name + "\n";

	let menu = [MainMeal, SecondMeal];
	return await menu;
}

async function postMenuToDiscord(channels, menu){
	//Send embed message
	channels.forEach(channel => {
		channel.send({
			embed: {
				"color": config.embedColor,
				"timestamp": new Date(),
				"footer": {
					"icon_url": "https://pbs.twimg.com/profile_images/441542471760097280/9sDmsLIm_400x400.jpeg",
					"text": config.bottomText + toHoliday()()
				},
				"fields": [
					{
						"name": "Lounas:",
						"value": menu[0],
						"inline": true
					},
					{
						"name": "Kasvislounas:",
						"value": menu[1],
						"inline": true
					}
				]
			}
		});
	})
}





// This function returns correct JSON file for corresponding week. Requires valid RestaurantId. Should be used only with scheduling to avoid unnecessary resource usage.
// Async needed for await and ...other for extra args in future
async function SetCWeekMenuURL(RestaurantID, ...other) {
	return new Promise(async (resolve, reject) => {
  	// URL should be moved to config file.
    let data = await fetch('https://ruokalistatkoulutjapaivakodit.arkea.fi/AromiStorage/blob/main/AromiMenusJsonData')
      .then((response) => {
          if (response.status >= 400) {
              throw new Error("Bad response from server");
          }
          return response.json();
      })
      .catch((e) => console.log(e))

    // Find correct restaurant with given RestaurantID.
    let restaurant = data.Restaurants.find((obj) => (obj.RestaurantId === RestaurantID));
		let today;
		let date = other.find((obj) => (typeof(Date)));
		if(date !== undefined) {
		    today = new Date(date);
		} else {
		    today = new Date();
		}

    if(restaurant !== undefined) {
        restaurant.JMenus.map((obj) => {
          let start = new Date(obj.Start);
          let end = new Date(obj.End);
          if(today >= start && today <= end) {
	          let LinkJSON = obj.LinkUrl;
	          resolve(LinkJSON);
          }
      })
    } else {
      reject("Invalid restaurant ID");
    }

  });
}

const days = ["Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai"]

const getEatingTime = ( atmClass, data ) => {
	if(atmClass === undefined) {
		return "Class needed"
	}
	let n = new Date().getDay() - 1
	if (n < 0 || n >= 5) {
		return "Invalid day"
	}
	const day = days[n]
	let times = data[day]
	for (let time in times) {
		if(times[time].toLowerCase().includes(atmClass.toLowerCase())) {
			return time
		}
	}
	return "Can't find that class for that day"
}

const toHoliday = () => {
	let date1 = new Date();
	let syysloma = new Date(lomat.syysloma);
	let joululoma = new Date(lomat.joululoma);
	let talviloma = new Date(lomat.talviloma);
	let kesaloma = new Date(lomat.kesaloma);
	let timeDiff = 0;
	let diffDays = 0;
	return (loma) => {
		if(loma) {
			switch (loma) {
				case 'joululoma':
					timeDiff = Math.abs(joululoma.getTime() - date1.getTime());
					diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
					return (diffDays-1) + " päivää joululomaan"
					break;
				case 'talviloma':
					timeDiff = Math.abs(talviloma.getTime() - date1.getTime());
					diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
					return (diffDays-1) + " päivää talvilomaan"
					break;
				case 'kesäloma':
					timeDiff = Math.abs(kesaloma.getTime() - date1.getTime());
					diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
					return (diffDays-1) + " päivää kesälomaan"
					break;
				default:
					if(syysloma.getTime() - date1.getTime() > 0) {
						timeDiff = Math.abs(syysloma.getTime() - date1.getTime());
						diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
						return (diffDays-1) + " päivää syyslomaan"
					} else if(joululoma.getTime() - date1.getTime() > 0) {
						timeDiff = Math.abs(joululoma.getTime() - date1.getTime());
						diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
						return (diffDays-1) + " päivää joululomaan"
					} else if(talviloma.getTime() - date1.getTime() > 0) {
						timeDiff = Math.abs(talviloma.getTime() - date1.getTime());
						diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
						return (diffDays-1) + " päivää talvilomaan"
					} else {
						timeDiff = Math.abs(kesaloma.getTime() - date1.getTime());
						diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
						return (diffDays-1) + " päivää kesälomaan"
					}
			}
		} else {
			timeDiff = Math.abs(kesaloma.getTime() - date1.getTime());
			diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
			return (diffDays-1) + " kesälomaan"
		}
	}
}



// Export all functions
export {getMenuFromArkea, postMenuToDiscord, SetCWeekMenuURL, getEatingTime, toHoliday, getChannelsFromConfig}
