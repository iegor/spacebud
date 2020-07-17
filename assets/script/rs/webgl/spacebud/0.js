var c;
var gl;
var game;

var planets = [];
var player;

class Game {
  constructor() {
    this.surface = document.getElementById('gfx_surface');
    this.surface.addEventListener('mousedown', onMouseDown, false);
    this.surface.addEventListener('mousemove', onMouseMove, false);
    document.onkeydown = onKeyDown;
    this.mv = glMatrix.mat4.create();
    this.mp = glMatrix.mat4.create();
    this.mvp = glMatrix.mat4.create();
    this.origin = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    this.cam0 = new look_at_camera;
    this.cam0.fov = glMatrix.glMatrix.toRadian(45.0);
    this.cam0.pos = glMatrix.vec4.fromValues(0.0, 0.0, 17.0, 1.0);
    this.cam0.tgt = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    this.cam0.up = glMatrix.vec4.fromValues(0.0, 1.0, 0.0, 1.0);
    this.rx = 1024;
    this.ry = 768;
    this.cc = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    this.ptr = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    this.ptr_mesh = new mesh();
    this.t_last = 0;
    this.t_now = 0;
    this.dt_f = 0;
    this.G = 0.0000000000674;
  }

  configure(j) {
    gl = this.surface.getContext('webgl', {antialias: false});
    if(!gl) {
      console.log('WebGL is not supported, Falling back to experimental-webgl');
      gl = c.getContext('experimental-webgl');
    }
    if(!gl) {
      alert('Your browser does not support WebGL');
    }
    this.surface.style.cursor = 'none';
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.set_screen_size(j.gfx.width, j.gfx.height);
  }

  loadPtrMesh(json) {
    this.ptr_mesh.loadFromJSON(gl, json);
  }

  set_screen_size(width, height) {
    let ar = width/height;
    this.rx = width;
    this.ry = height;
    if(!this.cam0) { console.error('camera is not initialized'); }
    gl.canvas.width = this.rx;
    gl.canvas.height = this.ry;
    gl.viewport(0, 0, this.rx, this.ry);
    glMatrix.mat4.perspective(this.mp,
      this.cam0.fov,
      ar,
      this.cam0.cpn,
      this.cam0.cpf);
  }

  update(d_time) {
    this.t_now = d_time;
    this.dt_f = this.t_now - this.t_last;
    this.cam0.pos[0] = player.pos[0];
    this.cam0.pos[1] = player.pos[1];
    this.cam0.tgt = player.pos;
    this.cam0.apply();
    planets.forEach(function(i) { i.update(); });
    player.update();
    this.ptr_mesh.moveTo(this.ptr);
    this.t_last = this.t_now;
  }

  draw() {
    gl.clearColor(this.cc[0], this.cc[1], this.cc[2], this.cc[3]);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    planets.forEach(function(i){ i.render(); });
    player.render();
  }
}

class rocket {
  constructor() {
    this.pos = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    this.rot = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    this.vel = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    this.acl = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    this.t_pos = glMatrix.vec4.fromValues(0.0, -1.0, 0.0, 1.0);
    this.t_rot = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    this.t_acl = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    this.scl = glMatrix.vec4.fromValues(1.0, 1.0, 1.0, 1.0);
    this.mesh = new mesh();
    this.mesh_thruster = new mesh();
    this.closest_planet = planets[0];
    this.psc = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    this.landed = false;
    this.rocket_z = 1.0;
  }

  load(j) {
    this.mesh.loadFromJSON(gl, j);
    this.mesh.loadTexture(j.textures[0]);
    this.pos = glMatrix.vec4.fromValues( j.physics.p_initial[0], j.physics.p_initial[1], j.physics.p_initial[2], 1.0);
    this.vel = glMatrix.vec4.fromValues( j.physics.v_initial[0], j.physics.v_initial[1], j.physics.v_initial[2], 1.0);
    this.mass = j.physics.mass;
    this.scl[0] = this.scl[1] = this.scl[2] = j.physics.radius;
  }

  update() {
    var ca, sa;
    glMatrix.vec3.scaleAndAdd(this.acl, this.acl, this.t_acl, 0.000025);
    this.t_acl[0] = this.t_acl[1] = this.t_acl[2] = 0.0;
    glMatrix.vec3.scaleAndAdd(this.vel, this.vel, this.acl, game.dt_f);
    if(!this.landed) {
      var d = 0.0;
      var dmin = 10e20;
      var dsqr = 0.0;
      planets.forEach((p) => {
        d = glMatrix.vec3.distance(p.pos, this.pos);
        dsqr = d * d;
        if(dmin > d) {
          this.closest_planet = p;
          dmin = d;
        }
        var v4fDist = glMatrix.vec3.create();
        glMatrix.vec3.normalize(v4fDist,
          glMatrix.vec3.subtract(v4fDist, p.pos, this.pos));
        var fc2 = game.G * p.mass / dsqr;
        glMatrix.vec3.scale(this.acl, v4fDist, fc2);
        glMatrix.vec3.scaleAndAdd(this.vel, this.vel, this.acl, game.dt_f);
      });
    }
    var cdir = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    glMatrix.vec3.subtract(cdir, this.pos, this.closest_planet.pos);
    glMatrix.vec3.normalize(cdir, cdir);
    if(this.closest_planet.ri > dmin) {
      glMatrix.vec3.copy(game.cam0.up, cdir);
    }  else {
      glMatrix.vec3.set(game.cam0.up, 0.0, 1.0, 0.0);
    }
    glMatrix.vec3.scale(this.psc, cdir, this.closest_planet.r);
    if(dmin < this.closest_planet.r) {
      glMatrix.vec3.copy(this.vel, [0.0, 0.0, 0.0]);
      this.landed = true;
      ca = Math.cos(this.closest_planet.rot[2]);
      sa = Math.sin(this.closest_planet.rot[2]);
      this.pos[0] = this.closest_planet.pos[0] + this.closest_planet.r * ca;
      this.pos[1] = this.closest_planet.pos[1] + this.closest_planet.r * sa;
    } else {
      glMatrix.vec3.scaleAndAdd(this.pos, this.pos, this.vel, game.dt_f);
      this.landed = false;
    }
    ca = Math.cos(-1.570796 + this.rot[2]);
    sa = Math.sin(-1.570796 + this.rot[2]);
    this.t_pos[0] = this.pos[0] + 2 * ca;
    this.t_pos[1] = this.pos[1] + 2 * sa;
    this.t_rot[2] = this.rot[2];
    this.pos[2] = this.rocket_z;
    this.t_pos[2] = this.rocket_z + 0.1;
    this.mesh.transform(this.pos, this.rot, this.scl);
    this.mesh_thruster.transform(this.t_pos, this.t_rot, this.scl);
  }

  render() {
    this.mesh.render();
    this.mesh_thruster.render();
  }
}

class planet {
  constructor() {
    this.name = "terra incognita";

    this.mass = 1.0;
    this.gravity = 1.0;
    this.w = 0.0;
    this.acl = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    this.vel = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    this.vsc = 0.05;
    this.pos = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    this.rot = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    this.scl = glMatrix.vec4.fromValues(1.0, 1.0, 1.0, 1.0);
    this.r = 1.0;
    this.ri = 1.2;
    this.mesh = new mesh();
  }

  load(j) {
    this.name = j.name;
    this.mesh.loadFromJSON(gl, j);
    this.mesh.loadTexture(j.textures[0]);
    this.pos = glMatrix.vec4.fromValues( j.physics.p_initial[0], j.physics.p_initial[1], j.physics.p_initial[2], 1.0);
    this.vel = glMatrix.vec4.fromValues( j.physics.v_initial[0], j.physics.v_initial[1], j.physics.v_initial[2], 1.0);
    this.mass = j.physics.mass;
    this.r = j.physics.radius;
    this.ri = this.r * 2.0;
    glMatrix.vec3.scale(this.scl, this.scl, this.r);
    this.w = glMatrix.glMatrix.toRadian(j.physics.rotation_speed);
  }

  update() {
    this.rot[2] += this.w * game.dt_f;
    this.mesh.transform(this.pos, this.rot, this.scl);
  }

  render() {
    this.mesh.render();
  }
}

var onKeyDown = function(e) {
  var ds = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
  glMatrix.vec3.subtract(ds, player.pos, player.t_pos);
  glMatrix.vec3.normalize(ds, ds);
  if(e.key == 'w') {
    player.t_acl[0] += ds[0];
    player.t_acl[1] += ds[1];
  }
  if(e.key == 's') {
    player.t_acl[0] -= ds[0];
    player.t_acl[1] -= ds[1];
  }
  if(e.key == 'q') {
    player.rot[2] -= 0.25;
  }
  if(e.key == 'e') {
    player.rot[2] += 0.25;
  }
  if(e.key == 'W') {
    game.cam0.pos[2] -= 1.0;
  }
  if(e.key == 'S') {
    game.cam0.pos[2] += 1.0;
  }
}

var mouse_xy_2_gl = function(x, y) {
  let rc = game.surface.getBoundingClientRect();
  let hw = rc.width * 0.5;
  let hh = rc.height * 0.5;

  return [ (x - rc.left - hw) / hw, (hh - (y - rc.top)) / hh ];
}

var onMouseDown = function(event) {
  let mo = mouse_xy_2_gl(event.clientX, event.clientY);
}

var onMouseMove = function(e) {
  game.ptr[0] += e.movementX * 0.02;
  game.ptr[1] += e.movementY * 0.02;
  if(e.buttons == 4) {
    player.rot[2] -= e.movementX * 0.02;
  }
}

var GameInit = function() { game = new Game(); start(); }

var start = function() {
  var loop = function(d_time) {
    game.update(d_time);
    game.draw();
    requestAnimationFrame(loop);
  };
  loadJSONResource("/spacebud/assets/script/rs/webgl/spacebud/rc.json",
    function(e, j) {
    if(e) { console.log("loading err: ", e); return; }
    game.configure(j.game);
    j.data.planets.forEach(function(i) { var p = new planet(); p.load(i); planets.push(p); });
    player = new rocket();
    player.load(j.data.rocket);
    player.mesh_thruster.loadFromJSON(gl, j.data.thruster);
    player.mesh_thruster.loadTexture(j.data.thruster.textures[0]);
    requestAnimationFrame(loop);
  });
}
