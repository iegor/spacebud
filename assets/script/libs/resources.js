var loadTextResource = function(url) {
  return new Promise(function(resolve, reject) {
    var rq = new XMLHttpRequest();
    rq.open('GET', url, true);
    rq.onload = function() {
      if(rq.status >= 200 && rq.status < 300) {
        resolve(rq.responseText);
      }
      else {
        reject('[EE] status:' + rq.status + ', url: ' + url);
      }
    }
    rq.send();
  });
}

var loadImage = function(url, callback) {
  var img = new Image();
  img.onload = function() {
    callback(null, img);
  };
  img.src = url;
}

var loadJSONResource = function(url, callback) {
  loadTextResource(url).then(
  function(json) {
    console.log('[OK] resource:json: ' + url);
    try {
      callback(null, JSON.parse(json));
    } catch(e) {
      callback(e);
    }
  }
  , function(status) {
    console.log('resource:json: ' + status);
  });
}

var create_shader = function(gl, type, source) {
  var shd = gl.createShader(type);
  gl.shaderSource(shd, source);
  gl.compileShader(shd);
  if(!gl.getShaderParameter(shd, gl.COMPILE_STATUS)) {
    console.error('[EE] ', type, ':compile: "', gl.getShaderInfoLog(shd), '"');
  }
  return shd;
}

var create_shader_program = function(gl, vsh, fsh) {
  var sp = gl.createProgram();
  gl.attachShader(sp, vsh);
  gl.attachShader(sp, fsh);
  gl.linkProgram(sp);
  if(!gl.getProgramParameter(sp, gl.LINK_STATUS)) {
    console.error('[EE] shader:link: "', gl.getProgramInfoLog(sp), '"');
  }
  gl.validateProgram(sp);
  if(!gl.getProgramParameter(sp, gl.VALIDATE_STATUS)) {
    console.error('[EE] shader:link: "', gl.getProgramInfoLog(sp), '"');
  }
  return sp;
}

var getPath = function(p) {
  p.pop();
  return p.join('/')+'/';
}
