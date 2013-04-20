Clazz.declarePackage ("J.adapter.readers.pymol");
Clazz.load (null, "J.adapter.readers.pymol.ModelSettings", ["java.lang.Boolean", "$.Float", "J.atomdata.RadiusData", "J.constant.EnumVdw", "J.modelset.Atom", "J.util.BSUtil", "$.Escape"], function () {
c$ = Clazz.decorateAsClass (function () {
this.id = 0;
this.bsAtoms = null;
this.info = null;
this.size = -1;
this.colixes = null;
this.colors = null;
this.argb = 0;
this.translucency = 0;
this.rd = null;
Clazz.instantialize (this, arguments);
}, J.adapter.readers.pymol, "ModelSettings");
Clazz.makeConstructor (c$, 
function (id, bsAtoms, info) {
this.id = id;
this.bsAtoms = bsAtoms;
this.info = info;
}, "~N,J.util.BS,~O");
$_M(c$, "offset", 
function (modelOffset, atomOffset) {
if (atomOffset <= 0) return;
if (this.id == 1073742032) {
var movie = this.info;
movie.put ("baseModel", Integer.$valueOf (modelOffset));
var aStates = movie.get ("states");
for (var i = aStates.size (); --i >= 0; ) J.util.BSUtil.offset (aStates.get (i), 0, atomOffset);

return;
}if (this.id == 1060866) {
var defs = this.info;
for (var i = defs.size (); --i >= 0; ) J.util.BSUtil.offset (defs.get (i), 0, atomOffset);

return;
}if (this.bsAtoms != null) J.util.BSUtil.offset (this.bsAtoms, 0, atomOffset);
if (this.colixes != null) {
var c =  Clazz.newShortArray (this.colixes.length + atomOffset, 0);
System.arraycopy (this.colixes, 0, c, atomOffset, this.colixes.length);
this.colixes = c;
}}, "~N,~N");
$_M(c$, "createShape", 
function (m, bsCarb) {
var sm = m.shapeManager;
var modelIndex = this.getModelIndex (m);
var atoms;
switch (this.id) {
case 1073742032:
sm.viewer.setMovie (this.info);
return;
case 4115:
var frame = (this.info).intValue ();
if (frame > 0) sm.viewer.setCurrentModelIndex (frame + modelIndex - 1);
 else {
sm.viewer.setAnimationRange (-1, -1);
sm.viewer.setCurrentModelIndex (-1);
}return;
case 3145770:
sm.viewer.displayAtoms (this.bsAtoms, false, false, Boolean.TRUE, true);
return;
case 1060866:
sm.viewer.defineAtomSets (this.info);
return;
case 1:
break;
case 0:
break;
case 24:
if (modelIndex < 0) return;
sm.setShapePropertyBs (0, "colors", this.colors, this.bsAtoms);
var s = (this.info)[0].toString ().$replace ('\'', '_').$replace ('"', '_');
var lighting = (this.info)[1];
var resolution = "";
if (lighting == null) {
lighting = "mesh nofill";
resolution = " resolution 1.5";
}s = "script('isosurface ID \"" + s + "\"" + " model " + m.models[modelIndex].getModelNumberDotted () + resolution + " select (" + J.util.Escape.eBS (this.bsAtoms) + ") only solvent " + (this.size / 1000) + " map property color";
s += " frontOnly " + lighting;
if (this.translucency > 0) s += " translucent " + this.translucency;
s += "')";
System.out.println ("shapeSettings: " + s);
sm.viewer.evaluateExpression (s);
return;
case 5:
sm.loadShape (this.id);
sm.setShapePropertyBs (this.id, "labels", this.info, this.bsAtoms);
return;
case 6:
if (modelIndex < 0) return;
sm.loadShape (this.id);
var md = this.info;
md.setModelSet (m);
var points = md.points;
for (var i = points.size (); --i >= 0; ) (points.get (i)).modelIndex = modelIndex;

sm.setShapePropertyBs (this.id, "measure", md, this.bsAtoms);
if (this.size != -1) sm.setShapeSizeBs (this.id, this.size, null, null);
return;
case 10:
case 9:
J.util.BSUtil.andNot (this.bsAtoms, bsCarb);
break;
case 16:
sm.loadShape (this.id);
sm.setShapePropertyBs (this.id, "ignore", J.util.BSUtil.copyInvert (this.bsAtoms, sm.viewer.getAtomCount ()), null);
break;
case 13:
this.id = 10;
var data =  Clazz.newFloatArray (this.bsAtoms.length (), 0);
this.rd =  new J.atomdata.RadiusData (data, 0, J.atomdata.RadiusData.EnumType.ABSOLUTE, J.constant.EnumVdw.AUTO);
atoms = sm.viewer.modelSet.atoms;
var sum = 0.0;
var sumsq = 0.0;
var min = 3.4028235E38;
var max = 0;
var n = this.bsAtoms.cardinality ();
for (var i = this.bsAtoms.nextSetBit (0); i >= 0; i = this.bsAtoms.nextSetBit (i + 1)) {
var value = J.modelset.Atom.atomPropertyFloat (null, atoms[i], 1112541199);
sum += value;
sumsq += (value * value);
if (value < min) min = value;
if (value > max) max = value;
}
var mean = (sum / n);
var stdev = Math.sqrt ((sumsq - (sum * sum / n)) / n);
var rad = (this.info)[1];
var range = (this.info)[2];
var scale_min = (this.info)[3];
var scale_max = (this.info)[4];
var power = (this.info)[5];
var transform = Clazz.floatToInt ((this.info)[6]);
var data_range = max - min;
var nonlinear = false;
switch (transform) {
case 0:
case 1:
case 2:
case 3:
nonlinear = true;
break;
}
for (var i = this.bsAtoms.nextSetBit (0), pt = 0; i >= 0; i = this.bsAtoms.nextSetBit (i + 1), pt++) {
var scale = J.modelset.Atom.atomPropertyFloat (null, atoms[i], 1112541199);
switch (transform) {
case 3:
case 7:
default:
break;
case 0:
case 4:
scale = 1 + (scale - mean) / range / stdev;
break;
case 1:
case 5:
scale = (scale - min) / data_range / range;
break;
case 2:
case 6:
scale /= range;
break;
case 8:
if (scale < 0.0) scale = 0.0;
scale = (Math.sqrt (scale / 8.0) / 3.141592653589793);
break;
}
if (scale < 0.0) scale = 0.0;
if (nonlinear) scale = Math.pow (scale, power);
if ((scale < scale_min) && (scale_min >= 0.0)) scale = scale_min;
if ((scale > scale_max) && (scale_max >= 0.0)) scale = scale_max;
data[i] = scale * rad;
}
break;
}
if (this.size != -1 || this.rd != null) sm.setShapeSizeBs (this.id, this.size, this.rd, this.bsAtoms);
if (this.translucency > 0) {
sm.setShapePropertyBs (this.id, "translucentLevel", Float.$valueOf (this.translucency), this.bsAtoms);
sm.setShapePropertyBs (this.id, "translucency", "translucent", this.bsAtoms);
}if (this.argb != 0) sm.setShapePropertyBs (this.id, "color", Integer.$valueOf (this.argb), this.bsAtoms);
 else if (this.colors != null) sm.setShapePropertyBs (this.id, "colors", this.colors, this.bsAtoms);
}, "J.modelset.ModelSet,J.util.BS");
$_M(c$, "getModelIndex", 
($fz = function (m) {
if (this.bsAtoms == null) return -1;
var iAtom = this.bsAtoms.nextSetBit (0);
return (iAtom < 0 ? -1 : m.atoms[iAtom].modelIndex);
}, $fz.isPrivate = true, $fz), "J.modelset.ModelSet");
$_M(c$, "setColors", 
function (colixes, translucency) {
this.colixes = colixes;
this.colors = [colixes, Float.$valueOf (translucency)];
}, "~A,~N");
$_M(c$, "setSize", 
function (size) {
this.size = Clazz.floatToInt (size * 1000);
}, "~N");
Clazz.defineStatics (c$,
"cPuttyTransformNormalizedNonlinear", 0,
"cPuttyTransformRelativeNonlinear", 1,
"cPuttyTransformScaledNonlinear", 2,
"cPuttyTransformAbsoluteNonlinear", 3,
"cPuttyTransformNormalizedLinear", 4,
"cPuttyTransformRelativeLinear", 5,
"cPuttyTransformScaledLinear", 6,
"cPuttyTransformAbsoluteLinear", 7,
"cPuttyTransformImpliedRMS", 8);
});
