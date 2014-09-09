engine.Player = function() {
	this.ENGINE_STATE = {FORWARD: 0, BACKWARD: 1, OFF: 2};

	this.ANGLE_STEP_ = 9 * Math.PI / 180;

	this.angle_ = 0;

	this.position_ = $V([300,250]);
	this.prevPosition_ = this.position_;
	this.velocity_ = $V([0,0]);

	this.engineState_ = this.ENGINE_STATE.OFF;
	this.maxVelocity_ = 8.0;
	this.engineForce_ = 4.0;

};

engine.Player.prototype.startEngine = function(state) {
	if(state === this.ENGINE_STATE.FORWARD) {
		this.engineForce_ = 4.0;
	}
	else if(state === this.ENGINE_STATE.BACKWARD) {
		this.engineForce_ = -4.0;
	}

	this.engineState_ = state;
};

engine.Player.prototype.stopEngine = function() {
	this.engineState_ = this.ENGINE_STATE.OFF;
};

engine.Player.prototype.rotate = function(amount) {
	this.angle_ += amount;
};

engine.Player.prototype.update = function(dt) {
	if(this.engineState_ !== this.ENGINE_STATE.OFF) {
		var forceVector = $V([1,0]);
		forceVector = forceVector.multiply(this.engineForce_ * dt);
		forceVector = forceVector.rotate(-this.angle_, [0,0]);
	
		this.velocity_ = this.velocity_.add(forceVector);
	} else {
		this.velocity_ = this.velocity_.subtract(this.velocity_.toUnitVector().multiply(1/2 * dt));
		if(this.velocity_.modulus() < 0.05) {
			this.velocity_ = $V([0,0]);
		}
	}

	if(this.velocity_.modulus() > this.maxVelocity_) {
		this.velocity_  = this.velocity_.toUnitVector().multiply(this.maxVelocity_);
	}

	this.prevPosition_ = this.position_;
	this.position_ = this.position_.add(this.velocity_.multiply(dt));
};

engine.Player.prototype.getCollisionNormal = function(rect) {
	if(this.prevPosition_.e(1) + 2 < rect.x &&
		this.position_.e(1) + 2 > rect.x) {

		return Vector.create([-1, 0]);
	}

	if(this.prevPosition_.e(1) > rect.x + rect.width &&
		this.position_.e(1) < rect.x + rect.width) {

		return Vector.create([1, 0]);
	}

	if(this.prevPosition_.e(2) + 2 < rect.y &&
		this.position_.e(2) + 2 > rect.y) {

		return Vector.create([0, -1]);
	}

	if(this.prevPosition_.e(2) > rect.y + rect.height &&
		this.position_.e(2) < rect.y + rect.height) {

		return Vector.create([0, 1]);
	}

	return null;
};
