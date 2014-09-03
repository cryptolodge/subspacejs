engine.Camera = function(x, y, width, height, tileSize) {
	this.position = {
		x: x, y: y
	}

	this.width = width;
	this.height = height;
	this.tileSize = tileSize;
}

engine.Camera.prototype.getLeftMost = function() {
	return this.position.x - (this.width / 2);
};

engine.Camera.prototype.getLeftMostTile = function() {
	return Math.floor(this.getLeftMost());
};

engine.Camera.prototype.getRightMost = function() {
	return this.position.x + (this.width / 2);
};

engine.Camera.prototype.getRightMostTile = function() {
	return Math.floor(this.getRightMost());
};

engine.Camera.prototype.getTopMost = function() {
	return this.position.y - (this.height / 2);
};

engine.Camera.prototype.getTopMostTile = function() {
	return Math.floor(this.getTopMost());
};

engine.Camera.prototype.getDownMost = function() {
	return this.position.y + (this.height / 2);
};

engine.Camera.prototype.getDownMostTile = function() {
	return Math.floor(this.getDownMost());
};

engine.Camera.prototype.xToScreen = function(x) {
	return (x - this.getLeftMost());
};

engine.Camera.prototype.yToScreen = function(y) {
	return (y - this.getTopMost());
};

engine.Camera.prototype.toScreen = function(pos) {
	return {
		x: this.xToScreen(pos.x),
		y: this.yToScreen(pos.y)
	}
}
