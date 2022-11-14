//Extended gl
var egl;
(function(egl) {

	const program = (function() {
		//at program construction
		let canvas, gl;
		//After construction
		let vs, fs;
		let iterations, storage;
		let indexed, inxb;

		//Init uniforms and attributes holder
		const uniforms = {};

		function getUniformFunc(type) {
			switch (type) {
				case 'float':
					return function(loc, value) {
						gl.uniform1f(loc, value);
					}
					break;
				case 'float[]':
					return function(loc, value) {
						gl.uniform1fv(loc, value);
					}
					break;


				case 'vec2':
					return function(loc, value) {
						gl.uniform2f(loc, value[0], value[1]);
					}
					break;
				case 'vec2[]':
					return function(loc, value) {
						gl.uniform2fv(loc, value);
					}
					break;

				case 'vec3':
					return function(loc, value) {
						gl.uniform3f(loc, value[0], value[1], value[2]);
					}
					break;
				case 'vec3[]':
					return function(loc, value) {
						gl.uniform3fv(loc, value);
					}
					break;

				case 'vec4':
					return function(loc, value) {
						gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
					}
					break;
				case 'vec4[]':
					return function(loc, value) {
						gl.uniform4fv(loc, value);
					}
					break;


				case 'mat2':
					return function(loc, value) {
						gl.uniformMatrix2fv(loc, false, value);
					}
					break;
				case 'mat3':
					return function(loc, value) {
						gl.uniformMatrix3fv(loc, false, value);
					}
					break;
				case 'mat4':
					return function(loc, value) {
						gl.uniformMatrix4fv(loc, false, value);
					}
					break;


				case 'int':
					return function(loc, value) {
						gl.uniform1i(loc, value);
					}
					break;
				case 'int[]':
					return function(loc, value) {
						gl.uniform1iv(loc, value);
					}
					break;
			}
		}
		const UNIFORM = /uniform\s+\w+\s\w+;/g;
		const attributes = {};
		const ATTRIB = /in\s+\w+\s+\w+;/g;

		//Constructor & prototype
		function program() {
			//create canvas and put it into body
			canvas = document.createElement('canvas');
			document.body.appendChild(canvas);

			//Init webgl2
			gl = canvas.getContext('webgl2', {
				antialias: false,
				preserveDrawingBuffer: true
			});
			//Clear the screen
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);

			storage = gl.DYNAMIC_DRAW;
			inxb = gl.createBuffer();
		}
		program.prototype = {
			compile: function() {
				//Parse shader sources
				fs = fs.trim(), vs = vs.trim();

				//Get uniforms as strings in array
				const u = [];
				//frag and vert
				m = UNIFORM.exec(fs);
				while (m != void 0) {
					u.push(m[0]);
					m = UNIFORM.exec(fs);
				}
				m = UNIFORM.exec(vs);
				while (m != void 0) {
					u.push(m[0]);
					m = UNIFORM.exec(vs);
				}

				//Get attributes as strings in array
				const a = [];
				//frag and vert
				m = ATTRIB.exec(fs);
				while (m != void 0) {
					a.push(m[0]);
					m = ATTRIB.exec(fs);
				}
				m = ATTRIB.exec(vs);
				while (m != void 0) {
					a.push(m[0]);
					m = ATTRIB.exec(vs);
				}

				//Create webgl2 shaders and program
				const vert = gl.createShader(gl.VERTEX_SHADER);
				gl.shaderSource(vert, vs);
				gl.compileShader(vert);
				const frag = gl.createShader(gl.FRAGMENT_SHADER);
				gl.shaderSource(frag, fs);
				gl.compileShader(frag);

				const program = gl.createProgram();
				gl.attachShader(program, vert);
				gl.attachShader(program, frag);
				gl.linkProgram(program);
				gl.useProgram(program);

				//Create uniform and attrib objects
				let type, name, args, obj;
				u.forEach(function(e) {
					args = e.replace(';', '').split(/\s+/);
					type = args[1];
					name = args[2];
					uniforms[name] = {
						type: type,
						data: null,
						location: gl.getUniformLocation(program, name),
						func: getUniformFunc(type)
					};
				});
				a.forEach(function(e) {
					args = e.replace(';', '').split(/\s+/);
					type = args[1];
					name = args[2];

					obj = {
						location: gl.getAttribLocation(program, name),
						buffer: gl.createBuffer(),
					};
					gl.enableVertexAttribArray(obj.location);
					attributes[name] = obj;
				});
			},
			draw: function() {
				if (indexed === true) {
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, inxb);
					gl.drawElements(gl.TRIANGLES, iterations, gl.UNSIGNED_SHORT, 0);
				} else {
					gl.drawArrays(gl.TRIANGLES, 0, iterations);
				}
			}
		};

		//Modifications for proxy
		const mods = {
			set: function(obj, key, value) {
				switch (key) {
					case 'width':
						canvas.style.width = value + 'px';
						break;
					case 'height':
						canvas.style.height = value + 'px';
						break;

					case 'vert':
						vs = value;
						break;
					case 'frag':
						fs = value;
						break;

					case 'iterations':
						iterations = value;
						break;
					case 'storage':
						storage = gl[value.toUpperCase() + '_DRAW'];
						break;

					case 'indices':
						indexed = true;
						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, inxb);
						gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(value), storage);
						break;

					default:
						if (key == void 0) break;
						if (uniforms[key]) {
							uniforms[key].func(uniforms[key].location, value);
						}
						if (attributes[key]) {
							gl.bindBuffer(gl.ARRAY_BUFFER, attributes[key].buffer);
							gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(value), storage);
							gl.vertexAttribPointer(attributes[key].location, value.length / iterations, gl.FLOAT, false, 0, 0);
						}
						break;
				}
			}
		};

		//Constructor
		return function() {
			return new Proxy(Reflect.construct(program, arguments), mods);
		};
	})();
	egl.program = program;

})(egl || (egl = {}));
