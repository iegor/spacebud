class look_at_camera {
  constructor() {
    this.tgt = [0, 0, 0];
    this.pos = [0, 0, 0];
    this.up = [0, 1, 0];
    this.fov = 0.0;
    this.cpn = 0.1;
    this.cpf = 1000.0;
  }

  apply() {
    glMatrix.mat4.lookAt(game.mv, this.pos, this.tgt, this.up);
    glMatrix.mat4.mul(game.mvp, game.mp, game.mv);
  }

  apply_ortho() {
    glMatrix.mat4.ortho(game.mv, -1, 1, -1, 1, 0.1, 8.0);
    glMatrix.mat4.mul(game.mvp, game.mp, game.mv);
  }
}

