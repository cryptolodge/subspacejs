var engine = {
	start: function(canvasId, resX, resY) {
		this.dom.init(canvasId, resX, resY);

		Promise.all([
			this.resources.init()
		])
		.then(function() {
			console.log("done");
		});
	}
};

engine.dom = {
	canvas: null,
	ctx: null,

	init: function(canvasId, resX, resY) {
		this.canvas = document.getElementById(canvasId);
		this.ctx = this.canvas.getContext("2d");

		this.canvas.width = resX;
		this.canvas.height = resY;
	}
};

engine.resources = {
	map: null,
	mapSpritesheet: null,

	init: function() {
		return Promise.all([
				engine.resourceLoader.image("resources/spritesheets/tiles.bmp"),
				engine.resourceLoader.map("resources/maps/map.json")
		])
		.then(function(resources) {
			for(var i = 0; i < resources.length; i++) {
				var target = null;

				if(resources[i].type === "map") {
					this.map = resources[i].data;
				} else if(resources[i].type === "img") {
					target = this.mapSpritesheet;
				}

				target = resources[i].data;
			}
		});
	}
};

engine.resourceLoader = {
	image: function(url) {
		var pr = new Promise(function(resolve, reject) {
			var img = new Image();
			img.onload = function() {
				resolve({type: "img", data: img});
			};
			img.src = url;
		});
		return pr;
	},

	map: function(url) {
		var pr = new Promise(function(resolve, reject) {
			$.ajax({
				dataType: "json",
				url: url,
				success: function(map) {
					resolve({type: "map", data: map});
				}
			});
		});
		return pr;
	}
}

