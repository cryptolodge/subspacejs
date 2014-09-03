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
					engine.renderer.init(canvasId, resX, resY),
					engine.resources.init(),

					engine.input.init(),
					engine.camera.init()
			]);
		})
		.then(function() {
			requestAnimationFrame(engine.loop);
		});
	},

	loop: function() {
		var lastTime = 0;

		return function cb(time) {
			var dt = (time - lastTime) / 1000;
			lastTime = time;

			engine.update(dt);
			engine.render();

			requestAnimationFrame(cb);
		}();
	},

	update: function(dt) {
		var speed = 6;

		if(engine.input.up) {
			engine.camera.cam.position.y -= speed * dt;
		}

		if(engine.input.right) {
			engine.camera.cam.position.x += speed * dt;
		}

		if(engine.input.down) {
			engine.camera.cam.position.y += speed * dt;
		}

		if(engine.input.left) {
			engine.camera.cam.position.x -= speed * dt;
		}
	},

	render: function() {
		engine.renderer.clear();

		for(var x = engine.camera.cam.getLeftMostTile(); x < engine.camera.cam.getRightMostTile() + 1; x++) {
			for(var y = engine.camera.cam.getTopMostTile(); y < engine.camera.cam.getDownMostTile() + 1; y++) {
				if(engine.resources.map[x] === undefined || engine.resources.map[x][y] === undefined) {
					continue;
				}

				var index = engine.resources.map[x][y];

				var screenPos = engine.camera.cam.toScreen({x: x, y: y});

				engine.renderer.drawTile(screenPos, index);
			}
		}
	}
};

engine.input = {
	up: false,
	right: false,
	down: false,
	left: false,

	init: function() {
		var self = this;

		window.onkeydown = window.onkeyup = function(e) {
			var val = null;
			if(e.type === "keydown") {
				val = true;
			} else if(e.type === "keyup") {
				val = false;
			}

			var input = null;
			switch(e.keyCode) {
			case 37:
				input = "left";
				break;
			case 38:
				input = "up";
				break;
			case 39:
				input = "right";
				break;
			case 40:
				input = "down";
				break;
			};

			if(input !== null) {
				self[input] = val;
			}
		};
	}
};

engine.camera = {
	cam: null,

	init: function() {
		this.cam = new engine.Camera(300, 250, engine.resolution.x / engine.tileSize, engine.resolution.y / engine.tileSize, engine.tileSize);
	}
};

engine.renderer = {
	canvas: null,
	ctx: null,

	init: function(canvasId, resX, resY) {
		this.canvas = document.getElementById(canvasId);
		this.ctx = this.canvas.getContext("2d");

		this.canvas.width = resX;
		this.canvas.height = resY;
	},

	clear: function() {
		this.ctx.save();
		this.ctx.fillStyle = "black";
		this.ctx.fillRect(0, 0, engine.resolution.x, engine.resolution.y);
		this.ctx.restore();
	},

	drawTile: function(position, tileIndex) {
		var clip = engine.resources.mapSpritesheet.indexToPosition(tileIndex);

		this.ctx.drawImage(engine.resources.mapSpritesheet.img, clip.x, clip.y, engine.tileSize, engine.tileSize, position.x * engine.tileSize, position.y * engine.tileSize, engine.tileSize, engine.tileSize);
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

