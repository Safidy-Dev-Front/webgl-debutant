const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
  console.error('WebGL non supporté par ce navigateur.');
}

// // Définir la couleur de fond (rouge ici)
// gl.clearColor(1.0, 0.0, 0.0, 1.0); // (R, G, B, A)
// // Nettoyer le canevas avec cette couleur
// gl.clear(gl.COLOR_BUFFER_BIT);

// 2. Définir les shaders (programmation du GPU)
// Vertex Shader : détermine la position des points
const vertextShaderSource = `
  attribute vec2 a_position; 
  uniform float u_angle; 
  uniform vec2 u_scale;
  uniform vec2 u_mouserotation;
  void main() {
  float cosA = cos(u_mouserotation.x);
  float sinA = sin(u_mouserotation.y);
  
    vec2 rotatedPosition = vec2(
      a_position.x * cosA - a_position.y * sinA,
      a_position.x * sinA + a_position.y * cosA
    );
    vec2 scaledPosition = rotatedPosition * 1.0;
    gl_Position = vec4(scaledPosition, 0.0, 1.0); 
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_mouse; 

  void main() {
     vec2 uv = gl_FragCoord.xy / vec2(800.0, 600.0); // Normalisation
  float dist = distance(uv, u_mouse); // Distance entre le pixel et la souris
  
  // Effet de halo : plus on est proche, plus c'est lumineux
  float glow = exp(-10.0 * dist); // Fonction exponentielle pour un effet doux

  // Couleur dynamique
  vec3 color = vec3(glow, glow * 0.5, glow * sin(u_time));
  
  gl_FragColor = vec4(color, 1.0);
  }
`;


function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Erreur de compilation du shader:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// 4. Compilation des shaders
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertextShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

// 5. Création du programme WebGL

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

// Vérifier si le programme est correctement lié
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error('Erreur de linkage du programme:', gl.getProgramInfoLog(program));
}else{
  console.log('PROGRAMME BIEN LIE=> ', gl.getProgramParameter(program, gl.LINK_STATUS));
}

// 6. Définir les données du triangle
const vertices = new Float32Array([
  -0.5,  0.5,   // Sommet supérieur
  0.5, 0.5,   // Bas gauche
  -0.5, -0.5 ,   // Bas droit
  
  0.5,  0.5,   // B - coin supérieur droit
  0.5, -0.5,   // C - coin inférieur droit
 -0.5, -0.5   // Bas droit
]);

// 7. Création du buffer
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// 8. Lier les données au shader
const positionLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
// 8. Uniform pour la translation
const translationLocation = gl.getUniformLocation(program, 'u_translation');
const angleLocation = gl.getUniformLocation(program, 'u_angle');
const scaleLocation = gl.getUniformLocation(program, 'u_scale');
const timeLocation = gl.getUniformLocation(program, 'u_time');
const mouseLocation = gl.getUniformLocation(program, 'u_mouse');
const mouseLocationRotate = gl.getUniformLocation(program, 'u_mouserotation');
// // 9. Dessiner le triangle
// gl.viewport(0, 0, canvas.width, canvas.height);
// gl.clearColor(0.0, 0.0, 0.0, 1.0); // Fond noir
// gl.clear(gl.COLOR_BUFFER_BIT);

// gl.useProgram(program);
// gl.drawArrays(gl.TRIANGLES, 0, 6); // 6 sommets (2 triangles)
// 9. Fonction de dessin
function drawScene(tx, ty) {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Fond noir
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);
  gl.uniform2f(translationLocation, tx, ty); // Appliquer la translation
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

let mouseX = 0.5 , mouseY = 0.5;
canvas.addEventListener("mousemove", (event)=>{
  const rect = canvas.getBoundingClientRect();
  mouseX = (event.clientX - rect.left) / rect.width;
  mouseY = 1.0 - (event.clientY - rect.top) / rect.height; // Inverser Y
  
  gl.uniform2f(mouseLocation, mouseX, mouseY);
  gl.uniform2f(mouseLocationRotate, mouseX, mouseY);
})
let x = -1.0; // Point de départ à gauche
let angle = 0; 

let scaleX = 1.0;
let scaleY = 1.0;
let growing = true; // Indique si on agrandit ou rétrécit

function animate(time) {
  const elapsedTime = time * 0.001; // Convertir en secondes
    angle -= 0.02; // Augmente l'angle (sens antihoraire)
    // Animation de l'échelle (effet "pulsation")
    if (growing) {
      scaleX += 0.01;
      scaleY += 0.01;
      if (scaleX > 1.5) growing = false; // Limite max
    } else {
      scaleX -= 0.01;
      scaleY -= 0.01;
      if (scaleX < 0.5) growing = true; // Limite min
    }
    gl.uniform1f(timeLocation, elapsedTime); // Envoyer le temps au shader
    gl.uniform1f(angleLocation, angle); // Envoie l'angle au shader
    gl.uniform2f(scaleLocation , scaleX , scaleY);
    gl.uniform2f(mouseLocation, mouseX, mouseY);
    gl.uniform2f(mouseLocationRotate, mouseX, mouseY);
    drawScene(0, 0); // Dessiner le rectangle avec rotation

    requestAnimationFrame(animate);
}

animate();
console.log("Obeject GL=> " , gl);

