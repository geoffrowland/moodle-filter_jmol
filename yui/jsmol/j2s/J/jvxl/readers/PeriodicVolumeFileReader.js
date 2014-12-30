Clazz.declarePackage ("J.jvxl.readers");
Clazz.load (["J.jvxl.readers.VolumeFileReader"], "J.jvxl.readers.PeriodicVolumeFileReader", null, function () {
c$ = Clazz.declareType (J.jvxl.readers, "PeriodicVolumeFileReader", J.jvxl.readers.VolumeFileReader);
Clazz.overrideMethod (c$, "readSurfaceData", 
function (isMapData) {
this.initializeSurfaceData ();
this.voxelData =  Clazz.newFloatArray (this.nPointsX, this.nPointsY, this.nPointsZ, 0);
this.readSkip ();
this.getPeriodicVoxels ();
var n;
n = this.nPointsX - 1;
for (var i = 0; i < this.nPointsY; ++i) for (var j = 0; j < this.nPointsZ; ++j) this.voxelData[n][i][j] = this.voxelData[0][i][j];


n = this.nPointsY - 1;
for (var i = 0; i < this.nPointsX; ++i) for (var j = 0; j < this.nPointsZ; ++j) this.voxelData[i][n][j] = this.voxelData[i][0][j];


n = this.nPointsZ - 1;
for (var i = 0; i < this.nPointsX; ++i) for (var j = 0; j < this.nPointsY; ++j) this.voxelData[i][j][n] = this.voxelData[i][j][0];


if (isMapData && this.volumeData.hasPlane ()) {
this.volumeData.setVoxelMap ();
for (var x = 0; x < this.nPointsX; ++x) {
for (var y = 0; y < this.nPointsY; ++y) {
for (var z = 0; z < this.nPointsZ; ++z) {
var f = this.volumeData.getToPlaneParameter ();
if (this.volumeData.isNearPlane (x, y, z, f)) this.volumeData.setVoxelMapValue (x, y, z, this.voxelData[x][y][z]);
}
}
}
this.voxelData = null;
}this.volumeData.setVoxelDataAsArray (this.voxelData);
if (this.dataMin > this.params.cutoff) this.params.cutoff = 2 * this.dataMin;
}, "~B");
});
