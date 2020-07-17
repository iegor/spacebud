class mesh {
  constructor() {
    this.vpbo = null;
    this.vpbo_len = 0;
    this.vcbo = null;
    this.tcbo = null;
    this.ibo = null;
    this.iblength = 0;
    this.vsh = null;
    this.fsh = null;
    this.sp = null;
    this.vsh_a_vp = null;
    this.vsh_a_vc = null;
    this.vsh_a_tc = null;
    this.mw_u = null;
    this.mw = new Float32Array(16);
    glMatrix.mat4.identity(this.mw);
    this.tex0 = null;
  }

  setVPBO(vpbo_Float32array) {
    this.vpbo = gl.createBuffer();
    this.vpbo_len = vpbo_Float32array.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vpbo);
    gl.bufferData(gl.ARRAY_BUFFER, vpbo_Float32array, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  setVCBO(vcbo_Float32array) {
    this.vcbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vcbo);
    gl.bufferData(gl.ARRAY_BUFFER, vcbo_Float32array, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  setTCBO(tcbo_Float32array) {
    this.tcbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tcbo);
    gl.bufferData(gl.ARRAY_BUFFER, tcbo_Float32array, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  setIBO(ibo_Uint16Array) {
    this.ibo = gl.createBuffer();
    this.iblength = ibo_Uint16Array.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ibo_Uint16Array, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  loadTexture(url) {
    var msh = this;
    loadImage(url, function(err, t) {
      msh.tex0 = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, msh.tex0);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, t);
      gl.bindTexture(gl.TEXTURE_2D, null);
    });
  }

  setShaderProgram(vshtxt, fshtxt) {
    this.vsh = create_shader(gl, gl.VERTEX_SHADER, vshtxt);
    this.fsh = create_shader(gl, gl.FRAGMENT_SHADER, fshtxt);
    this.sp = create_shader_program(gl, this.vsh, this.fsh);
    this.vsh_a_vp = gl.getAttribLocation(this.sp, 'vp');
    gl.enableVertexAttribArray(this.vsh_a_vp);
    this.vsh_a_vc = gl.getAttribLocation(this.sp, 'vc');
    gl.enableVertexAttribArray(this.vsh_a_vc);
    this.vsh_a_tc = gl.getAttribLocation(this.sp, 'vtc');
    gl.enableVertexAttribArray(this.vsh_a_tc);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.mw_u = gl.getUniformLocation(this.sp, "mWrld");
  }

  rotate(angle) {
    var identity = new Float32Array(16);
    glMatrix.mat4.identity(identity);
    var m_rot_x = new Float32Array(16);
    var m_rot_y = new Float32Array(16);
    var m_rot_z = new Float32Array(16);
    glMatrix.mat4.rotate(m_rot_x, identity, angle[0], [1, 0, 0]);
    glMatrix.mat4.rotate(m_rot_y, identity, angle[1], [0, 1, 0]);
    glMatrix.mat4.rotate(m_rot_z, identity, angle[2], [0, 0, 1]);
    glMatrix.mat4.mul(m_rot_x,  m_rot_x, m_rot_y);
    glMatrix.mat4.mul(this.mw,  m_rot_x, m_rot_z);
  }

  rotateX(angle) {
    var m_rot_x = new Float32Array(16);
    glMatrix.mat4.identity(m_rot_x);
    glMatrix.mat4.rotate(m_rot_x, m_rot_x, angle, [1, 0, 0]);
    glMatrix.mat4.mul(this.mw, this.mw,  m_rot_x);
  }

  rotateY(angle) {
    var m_rot_y = new Float32Array(16);
    glMatrix.mat4.identity(m_rot_y);
    glMatrix.mat4.rotate(m_rot_y, m_rot_y, angle, [0, 1, 0]);
    glMatrix.mat4.mul(this.mw, this.mw, m_rot_y);
  }

  moveTo(pos) {
    var identity = new Float32Array(16);
    glMatrix.mat4.identity(identity);
    glMatrix.mat4.translate(this.mw, identity, pos);
  }

  offsetByDelta(delta) {
    glMatrix.mat4.translate(this.mw, this.mw, delta);
  }

  scale(abs) {
    var im = new Float32Array(16);
    glMatrix.mat4.identity(im);
    glMatrix.mat4.scale(im, im, abs);
    glMatrix.mat4.mul(this.mw, this.mw, im);
  }

  transform(p, r, s) {
    var mr_x = new Float32Array(16);
    var mr_y = new Float32Array(16);
    var mr_z = new Float32Array(16);
    glMatrix.mat4.identity(this.mw);
    glMatrix.mat4.rotate(mr_x, this.mw, r[0], [1, 0, 0]);
    glMatrix.mat4.rotate(mr_y, this.mw, r[1], [0, 1, 0]);
    glMatrix.mat4.rotate(mr_z, this.mw, r[2], [0, 0, 1]);
    glMatrix.mat4.mul(mr_x, mr_x, mr_y);
    glMatrix.mat4.mul(mr_x, mr_x, mr_z);
    this.mw[12] = p[0];
    this.mw[13] = p[1];
    this.mw[14] = p[2];
    this.mw[0] = s[0];
    this.mw[5] = s[1];
    this.mw[10] = s[2];
    glMatrix.mat4.mul(this.mw, this.mw, mr_x);
  }

  loadFromJSON(gl, json) {
    this.setVPBO(new Float32Array(json.vb));
    this.setVCBO(new Float32Array(json.vc));
    this.setTCBO(new Float32Array(json.tc));
    this.setIBO(new Uint16Array(json.ib));
    this.setShaderProgram(
      json.vshtxt.join('\n'),
      json.fshtxt.join('\n'));
  }

  render() {
    gl.useProgram(this.sp);
    gl.uniformMatrix4fv(this.mw_u, gl.FALSE, this.mw);
    var mv_u = gl.getUniformLocation(this.sp, "mView");
    var mp_u = gl.getUniformLocation(this.sp, "mProj");
    gl.uniformMatrix4fv(mv_u, gl.FALSE, game.mv);
    gl.uniformMatrix4fv(mp_u, gl.FALSE, game.mp);
    gl.bindTexture(gl.TEXTURE_2D, this.tex0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vpbo);
    gl.vertexAttribPointer( this.vsh_a_vp, 3, gl.FLOAT, gl.FALSE, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vcbo);
    gl.vertexAttribPointer( this.vsh_a_vc, 3, gl.FLOAT, gl.FALSE, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tcbo);
    gl.vertexAttribPointer( this.vsh_a_tc, 2, gl.FLOAT, gl.FALSE, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.drawElements(gl.TRIANGLES, this.iblength, gl.UNSIGNED_SHORT, 0);
  }
}
