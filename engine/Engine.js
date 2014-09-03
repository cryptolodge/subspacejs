var engine = {
	resolution: {
		x: null,
		y: null
	},
	tileSize: 16,

	start: function(canvasId, resX, resY) {
		engine.resolution.x = resX;
		engine.resolution.y = resY;

		Promise.all([
			engine.resourceLoader.javascript("engine/Camera.js")
		])
		.then(function() {
			 return Promise.all([
					engine.dom.init(canvasId, resX, resY),
					engine.resources.init(),

					engine.camera.init()
			]);
		})
		.then(function() {
			requestAnimationFrame(engine.loop);
		});
	},

	loop: function() {
		var lastTime = 0;

		return function(time) {
			var dt = (time - lastTime) / 1000;
			lastTime = time;

			engine.update(dt);
			engine.render();
		}();
	},

	update: function(dt) {

	},

	render: function() {
		var ctx = engine.dom.ctx;

		ctx.save();
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, engine.resolution.x, engine.resolution.y);
		ctx.restore();

		for(var x = engine.camera.cam.getLeftMostTile(); x < engine.camera.cam.getRightMostTile() + 1; x++) {
			for(var y = engine.camera.cam.getTopMostTile(); y < engine.camera.cam.getDownMostTile() + 1; y++) {
				if(engine.resources.map[x] === undefined || engine.resources.map[x][y] === undefined) {
					continue;
				}

				var index = engine.resources.map[x][y];

				
				var clip = engine.resources.mapSpritesheet.indexToPosition(index);
				var screenPos = engine.camera.cam.toScreen({x: x, y: y});

				ctx.drawImage(engine.resources.mapSpritesheet.img, clip.x, clip.y, engine.tileSize, engine.tileSize, screenPos.x, screenPos.y, engine.tileSize, engine.tileSize);
			}
		}
	}
};

engine.camera = {
	cam: null,

	init: function() {
		this.cam = new engine.Camera(300, 250, engine.resolution.x / engine.tileSize, engine.resolution.y / engine.tileSize, engine.tileSize);
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
	mapSpritesheet: {
		img: null,

		indexToPosition: function(index) {
			var widthInTiles = this.img.width / engine.tileSize;

			var y = Math.floor(index / widthInTiles);
			var x = index % widthInTiles;

			return {x: x * engine.tileSize, y: y * engine.tileSize};
		}
	},

	init: function() {
		var self = this;

		return Promise.all([
				engine.resourceLoader.image("resources/spritesheets/tiles.bmp"),
				engine.resourceLoader.map("resources/maps/map.json")
		])
		.then(function(resources) {
			for(var i = 0; i < resources.length; i++) {
				if(resources[i].type === "map") {
					self.map = resources[i].data;
				} else if(resources[i].type === "img") {
					self.mapSpritesheet.img = resources[i].data;
				}
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

	javascript: function(url) {
		var pr = new Promise(function(resolve, reject) {
			var script = document.createElement("script");
			script.onload = function() {
				resolve({type: "javascript", data: script});
			};
			script.src = url;
			document.getElementsByTagName("head")[0].appendChild(script);
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

