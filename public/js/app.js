// API Endpoint
var baseUrl = 'http://www.omdbapi.com/?t=%27+searchText+%27&apikey=f7b92357';

// ------------------------------------------------------------------------------------------------------
// API Functions
//
// API functions that will make asynchronous calls to the node server and the OMDB
// ------------------------------------------------------------------------------------------------------

var api = {
	// Ajax call for GET and POST methods
	call: function(method, url, params, success, failure) {
		var xmlhttp = new XMLHttpRequest();

		xmlhttp.onreadystatechange = function() {
			if(xmlhttp.readyState == 4) {
				if(xmlhttp.status == 200) {
					if(success) {
						success(JSON.parse(xmlhttp.responseText));
					}
				} else {
					if(failure) {
						failure(JSON.parse(xmlhttp.responseText));
					}
				}
			}
		};

		var qs = [];
		for(var key in params) {
			qs.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
		}

		var payload = null;
		if(method == 'GET') {
			url += '?' + qs.join('&');
			xmlhttp.open(method, url, true);
		} else if(method == 'POST') {
			xmlhttp.open(method, url, true);
			payload = qs.join('&');
			xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		}

		xmlhttp.send(payload);
	},

	// Calls the search API from OMDB
	search: function(text, success, failure) {
		api.call('GET', baseUrl, {
			"r" : "json",
			"type" : "movie",
			"s" : text
		}, success, failure);
	},

	// Calls the get movie details API from OMDB
	getMovieDetails: function(id, success, failure) {
		api.call('GET', baseUrl, {
			"r" : "json",
			"plot" : "full",
			"i" : id
		}, success, failure);
	},

	// Calls the local get favorites endpoints
	favorites: function(success, failure) {
		api.call('GET', '/favorites', {}, success, failure);
	},

	favorite: function(id, name, success, failure) {
		api.call('POST', '/favorites', {
			name: name,
			oid: id
		}, success, failure);
	}
};

// ------------------------------------------------------------------------------------------------------
// Actions
//
// Actions that are called from within the page
// ------------------------------------------------------------------------------------------------------

var currentlySelectedMovieId;
var currentlySelectedMovieTitle;

// disables the favorite button and changes the text
var markAsFavorited = function() {
	document.querySelector("#results-movie-favorite").setAttribute("disabled", "disabled");
	document.querySelector("#results-movie-favorite").classList.remove('hidden');
	document.querySelector("#results-movie-favorite").innerHTML = 'Favorited!';
};

// Fetches and shows movie details
var showMovie = function(id) {
	// hide the panels during the ajax request
	document.querySelector("#results-search").classList.add('hidden');
	document.querySelector('#results-movie').classList.add('hidden');
	document.querySelector("#results-movie-favorite").classList.add('hidden');
	document.querySelector("#results-movie-favorite").removeAttribute("disabled");
	document.querySelector("#results-movie-favorite").innerHTML = 'Favorite';

	// let's add the details to the page
	api.getMovieDetails(id, function(response) {

		// check to see if it's already been favorited
		api.favorites(function(response) {
			var favorited = false;
			response.forEach(function(fav) {
				if(fav.oid == id) {
					markAsFavorited();
					favorited = true;
				}
			});
			document.querySelector("#results-movie-favorite").classList.remove('hidden');
		});

		currentlySelectedMovieId = id;
		currentlySelectedMovieTitle = response.Title;
		document.querySelector("#results-movie-title").innerHTML = response.Title;

		// handle the no poster case
		if(!response.Poster || response.Poster == 'N/A') {
			document.querySelector("#results-movie-poster").classList.add('hidden');
			document.querySelector("#results-movie-poster-na").classList.remove('hidden');
		} else {
			document.querySelector("#results-movie-poster").setAttribute("src", response.Poster);
			document.querySelector("#results-movie-poster-na").classList.add('hidden');
			document.querySelector("#results-movie-poster").classList.remove('hidden');
		}

		document.querySelector("#results-movie-released").innerHTML = response.Released;
		document.querySelector("#results-movie-year").innerHTML = response.Year;
		document.querySelector("#results-movie-country").innerHTML = response.Country;
		document.querySelector("#results-movie-director").innerHTML = response.Director;
		document.querySelector("#results-movie-writer").innerHTML = response.Writer;
		document.querySelector("#results-movie-actors").innerHTML = response.Actors;
		document.querySelector("#results-movie-awards").innerHTML = response.Awards;
		document.querySelector("#results-movie-runtime").innerHTML = response.Runtime;
		document.querySelector("#results-movie-genre").innerHTML = response.Genre;
		document.querySelector("#results-movie-language").innerHTML = response.Lanugage;
		document.querySelector("#results-movie-rated").innerHTML = response.Rated;
		document.querySelector("#results-movie-imdbrating").innerHTML = response.imdbRating;
		document.querySelector("#results-movie-plot").innerHTML = response.Plot;

		// and show the panel
		document.querySelector('#results-movie').classList.remove('hidden');
	}, function(response) {

	});
};

// searchs OMDB and shows the results
var searchMovies = function() {
	var searchText = document.querySelector("#text-search").value;

	if(searchText === '') {
		return;
	}

	document.querySelector("#button-search").setAttribute("disabled", "disabled");
	document.querySelector('#results-movie').classList.add('hidden');
	document.querySelector("#results-search").classList.remove('hidden');

	api.search(searchText, function(response) {

		document.querySelector("#results-search").innerHTML = '';
		document.querySelector("#button-search").removeAttribute("disabled");

		if(response.Response && response.Response == 'False') {
			document.querySelector("#results-search").innerHTML = '<div style="padding: 12px; border: 1px solid #ff9999; border-radius: 4px;" class="bg-danger text-center">' + response.Error + '</div>';
		} else {
			var listContainer = document.createElement("ul");

			response.Search.forEach(function(movie) {
				var listItem = document.createElement("li");
				var text = document.createTextNode(movie.Title);
				listItem.addEventListener("click", function(e) {
					showMovie(movie.imdbID);
				});
				listItem.appendChild(text);
				listContainer.appendChild(listItem);
			});

			document.querySelector("#results-search").appendChild(listContainer);
		}
	}, function(response) {
		document.querySelector("#button-search").removeAttribute("disabled");
		alert('There was an error with your request');
	});
};

// shows the list of favorited movies
var showFavorites = function() {
	document.querySelector('#results-movie').classList.add('hidden');
	document.querySelector("#results-search").classList.remove('hidden');

	api.favorites(function(response) {
		document.querySelector("#results-search").innerHTML = '';
		document.querySelector("#button-search").removeAttribute("disabled");

		if(response.length < 1) {
			document.querySelector("#results-search").innerHTML = '<div style="padding: 12px; border: 1px solid #ff9999; border-radius: 4px;" class="bg-danger text-center">You don\'t have any favorites yet.</div>';
		} else {
			var listContainer = document.createElement("ul");

			response.forEach(function(movie) {
				var listItem = document.createElement("li");
				var text = document.createTextNode(movie.name);
				listItem.addEventListener("click", function(e) {
					showMovie(movie.oid);
				});
				listItem.appendChild(text);
				listContainer.appendChild(listItem);
			});

			document.querySelector("#results-search").appendChild(listContainer);
		}
	}, function(response) {
		document.querySelector("#button-search").removeAttribute("disabled");
		alert('There was an error with your request');
	});
};

// favorites a movie
var favoriteMovie = function() {
	api.favorite(currentlySelectedMovieId, currentlySelectedMovieTitle);
	markAsFavorited();
};

// ------------------------------------------------------------------------------------------------------
// Listeners
//
// Add listeners to dom elements on the page
// ------------------------------------------------------------------------------------------------------

document.querySelector("#button-search").addEventListener("click", searchMovies);
document.querySelector("#button-favorites").addEventListener("click", showFavorites);
document.querySelector("#results-movie-favorite").addEventListener("click", favoriteMovie);
