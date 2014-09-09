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
			engine.resourceLoader.javascript("engine/Camera.js"),
			engine.resourceLoader.javascript("engine/Player.js")
		])
		.then(function() {
			 return Promise.all([
					engine.renderer.init(canvasId, resX, resY),
					engine.resources.init(),

					engine.input.init(),
					engine.camera.init(),
					engine.players.init()
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
		};
	}(),

	update: function(dt) {
		var speed = 6;

		var player = engine.players.players[engine.players.id];

		if(engine.input.up) {
			player.startEngine(player.ENGINE_STATE.FORWARD);
		} else if(engine.input.down) {
			player.startEngine(player.ENGINE_STATE.BACKWARD);
		} else {
			player.stopEngine();
		}

		if(engine.input.right) {
			player.rotate(-dt * Math.PI);
		} else if(engine.input.left) {
			player.rotate(dt * Math.PI);
		}

		player.update(dt);

		for(var x = Math.floor(player.position_.e(1)); x < Math.floor(player.position_.e(1) + 3); x++) {
			for(var y = Math.floor(player.position_.e(2)); y < Math.floor(player.position_.e(2) + 3); y++) {
				if(engine.resources.map[x] === undefined || engine.resources.map[x][y] === undefined) {
					continue;
				}

				var normal = player.getCollisionNormal({x: x, y: y, width: 1, height: 1});

				if(normal === null) {
					continue;
				}

				player.position_ = player.prevPosition_;

				var reflection = player.velocity_.subtract(
						normal.multiply(2 * player.velocity_.dot(normal))
				);

				player.velocity_ = reflection.multiply(1/2);
			}
		}

		engine.camera.cam.position.x = player.position_.e(1);
		engine.camera.cam.position.y = player.position_.e(2);
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

		var ctx = engine.renderer.ctx;
		ctx.save();
		ctx.translate(416, 316);
		ctx.rotate(-engine.players.players[0].angle_);
		ctx.translate(-16, -16);
		ctx.drawImage(engine.resources.ships.warbird, 0, 0);
		ctx.restore();
	}
};

engine.players = {
	id: 0,
	players: [],

	init: function() {
		this.players[this.id] = new engine.Player();
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
				return false;
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

		this.ctx.drawImage(engine.resources.mapSpritesheet.img, clip.x, clip.y, engine.tileSize, engine.tileSize, Math.round(position.x * engine.tileSize), Math.round(position.y * engine.tileSize), engine.tileSize, engine.tileSize);
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

	ships: {},

	init: function() {
		var self = this;

		return Promise.all([
				engine.resourceLoader.image("resources/spritesheets/tiles.bmp", "tiles"),
				engine.resourceLoader.image("resources/warbird.png", "warbird"),
				engine.resourceLoader.map("resources/maps/map.json")
		])
		.then(function(resources) {
			for(var i = 0; i < resources.length; i++) {
				if(resources[i].type === "map") {
					self.map = resources[i].data;
				} else if(resources[i].type === "img") {
					if(resources[i].name === "tiles") {
						self.mapSpritesheet.img = resources[i].data;
					} else if(resources[i].name === "warbird") {
						self.ships[resources[i].name] = resources[i].data;
					}
				}
			}
		});
	}
};

engine.resourceLoader = {
	image: function(url, name) {
		var pr = new Promise(function(resolve, reject) {
			var img = new Image();
			img.onload = function() {
				resolve({type: "img", data: img, name: name});
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

