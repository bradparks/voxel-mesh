var voxel = require('voxel')
var THREE = require('three')

module.exports = function(data, scaleFactor, mesher) {
  return new Mesh(data, scaleFactor, mesher)
}

module.exports.Mesh = Mesh

function Mesh(data, scaleFactor, mesher) {
  this.data = data
  var geometry = this.geometry = new THREE.Geometry()
  this.scale = scaleFactor || new THREE.Vector3(10, 10, 10)
  
  mesher = mesher || voxel.meshers.greedy
  var result = mesher( data.voxels, data.dims )
  this.meshed = result

  geometry.vertices.length = 0
  geometry.faces.length = 0

  for (var i = 0; i < result.vertices.length; ++i) {
    var q = result.vertices[i]
    geometry.vertices.push(new THREE.Vector3(q[0], q[1], q[2]))
  } 
  
  for (var i = 0; i < result.faces.length; ++i) {
    var vs = [
      result.vertices[i*4+0],
      result.vertices[i*4+1],
      result.vertices[i*4+2],
      result.vertices[i*4+3]
    ]
    var size = {
      x: Math.max(
        Math.abs(vs[0][0] - vs[1][0]),
        Math.abs(vs[1][0] - vs[2][0])
      ),
      y: Math.max(
        Math.abs(vs[0][1] - vs[1][1]),
        Math.abs(vs[1][1] - vs[2][1])
      ),
      z: Math.max(
        Math.abs(vs[0][2] - vs[1][2]),
        Math.abs(vs[1][2] - vs[2][2])
      )
    }
    if (size.x === 0) {
      var width = size.z
      var height = size.y
    }
    if (size.y === 0) {
      var width = size.x
      var height = size.z
    }
    if (size.z === 0) {
      var width = size.x
      var height = size.y
    }

    geometry.faceVertexUvs[0].push([
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0, height),
      new THREE.Vector2(width, height),
      new THREE.Vector2(width, 0)
    ])
    
    var q = result.faces[i]
    if (q.length === 5) {
      var f = new THREE.Face4(q[0], q[1], q[2], q[3])
      f.color = new THREE.Color(q[4])
      f.vertexColors = [f.color,f.color,f.color,f.color]
      geometry.faces.push(f)
    } else if (q.length == 4) {
      var f = new THREE.Face3(q[0], q[1], q[2])
      f.color = new THREE.Color(q[3])
      f.vertexColors = [f.color,f.color,f.color]
      geometry.faces.push(f)
    }
  }
  
  geometry.computeFaceNormals()

  geometry.verticesNeedUpdate = true
  geometry.elementsNeedUpdate = true
  geometry.normalsNeedUpdate = true

  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()

}

Mesh.prototype.createWireMesh = function(hexColor) {    
  var wireMaterial = new THREE.MeshBasicMaterial({
    color : hexColor || 0xffffff,
    wireframe : true
  })
  wireMesh = new THREE.Mesh(this.geometry, wireMaterial)
  wireMesh.scale = this.scale
  wireMesh.doubleSided = true
  this.wireMesh = wireMesh
  return wireMesh
}

Mesh.prototype.createSurfaceMesh = function(material) {
  material = material || new THREE.MeshNormalMaterial()
  var surfaceMesh  = new THREE.Mesh( this.geometry, material )
  surfaceMesh.scale = this.scale
  surfaceMesh.doubleSided = false
  this.surfaceMesh = surfaceMesh
  return surfaceMesh
}

Mesh.prototype.addToScene = function(scene) {
  if (this.wireMesh) scene.add( this.wireMesh )
  if (this.surfaceMesh) scene.add( this.surfaceMesh )
}

Mesh.prototype.setPosition = function(x, y, z) {
  if (this.wireMesh) this.wireMesh.position = new THREE.Vector3(x, y, z)
  if (this.surfaceMesh) this.surfaceMesh.position = new THREE.Vector3(x, y, z)
}
;
