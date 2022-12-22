Clazz.declarePackage ("J.adapter.readers.xml");
Clazz.load (["J.adapter.readers.xml.XmlReader", "J.adapter.smarter.Atom", "$.Bond"], "J.adapter.readers.xml.XmlChemDrawReader", ["java.lang.Boolean", "JU.BS", "$.PT", "J.api.JmolAdapter"], function () {
c$ = Clazz.decorateAsClass (function () {
this.minX = 3.4028235E38;
this.minY = 3.4028235E38;
this.minZ = 3.4028235E38;
this.maxZ = -3.4028235E38;
this.maxY = -3.4028235E38;
this.maxX = -3.4028235E38;
this.no3D = false;
Clazz.instantialize (this, arguments);
}, J.adapter.readers.xml, "XmlChemDrawReader", J.adapter.readers.xml.XmlReader);
Clazz.makeConstructor (c$, 
function () {
Clazz.superConstructor (this, J.adapter.readers.xml.XmlChemDrawReader, []);
});
Clazz.overrideMethod (c$, "processXml", 
function (parent, saxReader) {
this.is2D = true;
this.no3D = parent.checkFilterKey ("NO3D");
this.noHydrogens = parent.noHydrogens;
this.processXml2 (parent, saxReader);
this.filter = parent.filter;
}, "J.adapter.readers.xml.XmlReader,~O");
Clazz.overrideMethod (c$, "processStartElement", 
function (localName, nodeName) {
if ("fragment".equals (localName)) {
return;
}if ("n".equals (localName)) {
if (this.asc.bsAtoms == null) this.asc.bsAtoms =  new JU.BS ();
var id = this.atts.get ("id");
var nodeType = this.atts.get ("nodetype");
this.atom =  new J.adapter.readers.xml.XmlChemDrawReader.CDAtom (id, nodeType);
var warning = this.atts.get ("warning");
if (warning != null) {
(this.atom).warning = JU.PT.rep (warning, "&apos;", "'");
(this.atom).isValid = (warning.indexOf ("ChemDraw can't interpret") < 0);
}var element = this.atts.get ("element");
this.atom.elementNumber = (warning != null && warning.indexOf ("valence") < 0 && warning.indexOf ("very close") < 0 ? 0 : element == null ? 6 : this.parseIntStr (element));
element = J.api.JmolAdapter.getElementSymbol (this.atom.elementNumber);
if (this.atom.elementNumber == 0) {
System.err.println ("XmlChemDrawReader: Could not read elementSymbol for " + element);
}var isotope = this.atts.get ("isotope");
if (isotope != null) element = isotope + element;
this.setElementAndIsotope (this.atom, element);
var s = this.atts.get ("charge");
if (s != null) {
this.atom.formalCharge = this.parseIntStr (s);
}var hasXYZ = (this.atts.containsKey ("xyz"));
var hasXY = (this.atts.containsKey ("p"));
if (hasXYZ && (!this.no3D || !hasXY)) {
this.is2D = false;
this.setAtom ("xyz");
} else if (this.atts.containsKey ("p")) {
this.setAtom ("p");
}this.asc.addAtomWithMappedSerialNumber (this.atom);
this.asc.bsAtoms.set (this.atom.index);
return;
}if ("s".equals (localName)) {
if ((this.atom).warning != null) {
this.setKeepChars (true);
}}if ("b".equals (localName)) {
var atom1 = this.atts.get ("b");
var atom2 = this.atts.get ("e");
var invertEnds = false;
var order = (this.atts.containsKey ("order") ? this.parseIntStr (this.atts.get ("order")) : 1);
var buf = this.atts.get ("display");
if (buf != null) {
if (buf.equals ("WedgeEnd")) {
invertEnds = true;
order = 1025;
} else if (buf.equals ("WedgeBegin")) {
order = 1025;
} else if (buf.equals ("Hash") || buf.equals ("WedgedHashBegin")) {
order = 1041;
} else if (buf.equals ("WedgedHashEnd")) {
invertEnds = true;
order = 1041;
}}this.asc.addBondNoCheck ( new J.adapter.readers.xml.XmlChemDrawReader.CDBond ((invertEnds ? atom2 : atom1), (invertEnds ? atom1 : atom2), order));
return;
}}, "~S,~S");
Clazz.defineMethod (c$, "setAtom", 
 function (key) {
var xyz = this.atts.get (key);
var tokens = JU.PT.getTokens (xyz);
var x = this.parseFloatStr (tokens[0]);
var y = -this.parseFloatStr (tokens[1]);
var z = (key === "xyz" ? this.parseFloatStr (tokens[2]) : 0);
if (x < this.minX) this.minX = x;
if (x > this.maxX) this.maxX = x;
if (y < this.minY) this.minY = y;
if (y > this.maxY) this.maxY = y;
if (z < this.minZ) this.minZ = z;
if (z > this.maxZ) this.maxZ = z;
this.atom.set (x, y, z);
}, "~S");
Clazz.overrideMethod (c$, "processEndElement", 
function (localName) {
if ("s".equals (localName)) {
var w = (this.atom).warning;
if (w != null) {
var group = this.chars.toString ();
this.parent.appendLoadNote ("Warning: " + group + " " + w);
}}this.setKeepChars (false);
}, "~S");
Clazz.overrideMethod (c$, "finalizeSubclassReader", 
function () {
this.fixConnections ();
this.fixInvalidAtoms ();
this.center ();
this.asc.setInfo ("minimize3D", Boolean.$valueOf (!this.is2D && !this.noHydrogens));
this.set2D ();
this.asc.setInfo ("is2D", Boolean.$valueOf (this.is2D));
if (this.is2D) this.asc.setModelInfoForSet ("dimension", "2D", this.asc.iSet);
this.parent.appendLoadNote ("ChemDraw CDXML: " + (this.is2D ? "2D" : "3D"));
});
Clazz.defineMethod (c$, "fixConnections", 
 function () {
for (var i = 0, n = this.asc.bondCount; i < n; i++) {
var b = this.asc.bonds[i];
if (b == null) continue;
var a1 = this.asc.getAtomFromName ((b).id1);
var a2 = this.asc.getAtomFromName ((b).id2);
a1.isConnected = true;
a2.isConnected = true;
var pt = (a1.isFragment || a1.isNickname || a1.isConnectionPt ? a1 : a2.isFragment || a2.isNickname || a2.isConnectionPt ? a2 : null);
if (pt != null) {
for (var j = this.asc.bsAtoms.nextSetBit (0); j >= 0; j = this.asc.bsAtoms.nextSetBit (j + 1)) {
var a = this.asc.atoms[j];
if (a.isFragment || a.isNickname) continue;
if (Math.abs (a.x - pt.x) < 0.1 && Math.abs (a.y - pt.y) < 0.1) {
if (pt === a1) {
a1 = a;
} else {
a2 = a;
}break;
}}
}b.atomIndex1 = a1.index;
b.atomIndex2 = a2.index;
}
});
Clazz.defineMethod (c$, "center", 
 function () {
if (this.minX > this.maxX) return;
var sum = 0;
var n = 0;
var lenH = 1;
for (var i = this.asc.bondCount; --i >= 0; ) {
var a1 = this.asc.atoms[this.asc.bonds[i].atomIndex1];
var a2 = this.asc.atoms[this.asc.bonds[i].atomIndex2];
var d = a1.distance (a2);
if (a1.elementNumber > 1 && a2.elementNumber > 1) {
sum += d;
n++;
} else {
lenH = d;
}}
var f = (sum > 0 ? 1.45 * n / sum : lenH > 0 ? 1 / lenH : 1);
if (f > 0.5) f = 1;
var cx = (this.maxX + this.minX) / 2;
var cy = (this.maxY + this.minY) / 2;
var cz = (this.maxZ + this.minZ) / 2;
for (var i = this.asc.ac; --i >= 0; ) {
var a = this.asc.atoms[i];
a.x = (a.x - cx) * f;
a.y = (a.y - cy) * f;
a.z = (a.z - cz) * f;
}
});
Clazz.defineMethod (c$, "fixInvalidAtoms", 
 function () {
for (var i = this.asc.ac; --i >= 0; ) {
var a = this.asc.atoms[i];
a.atomSerial = -2147483648;
if (a.isFragment || a.isNickname || a.isConnectionPt || !a.isValid && !a.isConnected) {
System.out.println ("removing atom " + a.id + " " + a.nodeType);
this.asc.bsAtoms.clear (a.index);
}}
});
Clazz.pu$h(self.c$);
c$ = Clazz.decorateAsClass (function () {
this.warning = null;
this.id = null;
this.isValid = true;
this.isConnected = false;
this.isFragment = false;
this.isNickname = false;
this.isConnectionPt = false;
this.nodeType = null;
Clazz.instantialize (this, arguments);
}, J.adapter.readers.xml.XmlChemDrawReader, "CDAtom", J.adapter.smarter.Atom);
Clazz.makeConstructor (c$, 
function (a, b) {
Clazz.superConstructor (this, J.adapter.readers.xml.XmlChemDrawReader.CDAtom, []);
this.id = a;
this.atomSerial = Integer.parseInt (a);
this.nodeType = b;
this.isFragment = "Fragment".equals (b);
this.isNickname = "Nickname".equals (b);
this.isConnectionPt = "ExternalConnectionPoint".equals (b);
}, "~S,~S");
c$ = Clazz.p0p ();
Clazz.pu$h(self.c$);
c$ = Clazz.decorateAsClass (function () {
this.id1 = null;
this.id2 = null;
Clazz.instantialize (this, arguments);
}, J.adapter.readers.xml.XmlChemDrawReader, "CDBond", J.adapter.smarter.Bond);
Clazz.makeConstructor (c$, 
function (a, b, c) {
Clazz.superConstructor (this, J.adapter.readers.xml.XmlChemDrawReader.CDBond, []);
this.id1 = a;
this.id2 = b;
this.order = c;
}, "~S,~S,~N");
c$ = Clazz.p0p ();
});
