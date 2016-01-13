<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Strings for filter_jmol
 *
 * @package    filter
 * @subpackage jmol
 * @copyright  2006 Dan Stowell Original version for Moodle 1.x
 * @copyright  2010 Geoffrey Rowland <rowland dot geoff at gmail dot com> Update for Moodle 2.x
 * @copyright  2013 Geoffrey Rowland <rowland dot geoff at gmail dot com> Update for JavaScript/HTML5 JSmol
 * @copyright  2015 Geoffrey Rowland <rowland dot geoff at gmail dot com> Update for Moodle 2.9
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @license    For Jmol/JSmol licence, see inside the bundled jmol and jsmol folders
 */

defined('MOODLE_INTERNAL') || die();

// Jmol settings.
$string['pluginname'] = 'Jmol';
$string['jsmol'] = 'JSmol';
$string['jsmol_link'] = 'http://google.co.uk';
$string['jsmol_desc'] = 'JSmol';
$string['taskcleanjmoltemp'] = 'Clean Jmol filter temp files';
$string['jmolfiletypes'] = 'Jmol file types';
$string['jmolfiletypes_desc'] = 'Description of Jmol file types';
$string['use'] = 'Display technology';
$string['loading'] = 'Loading...';
$string['use_desc'] = 'Description of display technologyl';
// Jmol controls.
$string['filtername'] = 'Jmol';
$string['antialias'] = 'Antialias';
$string['style'] = 'Style';
$string['spin'] = 'Spin ';
$string['download'] = 'Download';
$string['unitcell'] = 'Unit cell';
$string['wireframe'] = 'Wireframe';
$string['sticks'] = 'Sticks';
$string['ballandstick'] = 'Ball and stick';
$string['spacefill'] = 'Spacefill';
$string['spacefill_desc'] = 'van der Waals radius';
$string['cartoon'] = 'Cartoon';
$string['cartoon_desc'] = 'Secondary structure cartoon';
$string['fancy'] = 'Fancy';
$string['fancy_desc'] = 'Secondary structure fancy cartoon';
$string['ribbon'] = 'Ribbon';
$string['backbone'] = 'Backbone';
$string['backbone_desc'] = 'Backbone only';
$string['polyhedra'] = 'Polyhedra';
$string['fullscreen'] = 'Fullscreen';
$string['backgroundcolour'] = 'Background colour';
$string['whitebackground'] = 'White background';
$string['lightgreybackground'] = 'Light grey background';
$string['blackbackground'] = 'Black background';
$string['display'] = 'Display';
$string['stick'] = 'Stick';
$string['dots'] = 'Dots';
$string['dots_desc'] = 'Dotted van der Waals surface';
$string['surface'] = 'Surface';
$string['surface_desc'] = 'van der Waals surface';
$string['colourscheme'] = 'Colour scheme';
$string['primary'] = 'Primary';
$string['primary_desc'] = 'Colour primary structure (residue sequence)';
$string['secondary'] = 'Secondary';
$string['secondary_desc'] = 'Colour secondary structure';
$string['tertiary'] = 'Tertiary';
$string['tertiary_desc'] = 'Colour tertiary structure';
$string['quaternary'] = 'Quaternary';
$string['quaternary_desc'] = 'Colour quaternary structure';
$string['labels'] = 'Labels';
$string['off'] = 'Labels off';
$string['off_desc'] = 'Labels off';
$string['atoms'] = 'Atoms';
$string['atoms_desc'] = 'Atom labels';
$string['residues'] = 'Residues';
$string['residues_desc'] = 'Residue labels';
$string['termini'] = 'Termini';
$string['termini_desc'] = 'Termini labels';
$string['hbonds'] = 'H&nbsp;bonds ';
$string['hbonds_desc'] = 'Hydrogen bonds';
$string['ssbonds'] = 'SS&nbsp;bonds ';
$string['ssbonds_desc'] = 'Disuphide bonds';
$string['crystallography'] = 'Crystallography';
$string['molecular'] = 'Molecular';
$string['unitcell'] = 'Unit&nbsp;cell ';
$string['unitcell_desc'] = 'Crystallographic unit cell';
$string['axes'] = 'Axes ';
$string['axes_desc'] = 'Crystallographic axes';
$string['cell'] = '1x1x1 cell';
$string['cell_desc'] = '1x1x1 unit cell';
$string['bigcell'] = '3x3x3 cells';
$string['bigcell_desc'] = '3x3x3 unit cells';
$string['cellfilled'] = '1x1x1 filled';
$string['cellfilled_desc'] = '1x1x1 unit cell with filled faces';
$string['cellpolyhedra'] = '1x1x1 poly';
$string['cellpolyhedra_desc'] = '1x1x1 unit cell with polyhedra';
$string['bigcellpolyhedra'] = '3x3x3 poly';
$string['bigcellpolyhedra_desc'] = '3x3x3 unit cells with polyhedra';
$string['performance'] = 'Performance';
$string['allfeatures'] = 'All features';
$string['noantialiasing'] = 'No antialiasing';
$string['notranslucency'] = 'No translucency';
$string['surfacesdotted'] = 'Surfaces dotted';
$string['cartoonsastrace'] = 'Cartoons as trace';
$string['geosurfaceasdots'] = 'Geosurface as dots';
$string['ellipsoidsasdots'] = 'Ellipsoids as dots';
$string['wireframeonly'] = 'Wireframe only';
$string['displaytechnology'] = 'Display technology';
$string['displaymenu'] = 'Display menu';
$string['displayconsole'] = 'Display console';
$string['downloadpngj'] = 'Download PNGJ structure + image file';
$string['togglefullscreen'] = 'Toggle fullscreen';
$string['help'] = 'Help';
$string['nojavasupport'] = 'Jmol requires Java. Your browser does not support Java. Please try one of the following:<ol><li>Select a different display technology, JSmol (HTML5) or GLmol (WebGL), from the menu</li><li>Use a different, Java-supporting browser (Firefox, Safari or Internet Explorer). See <a target=\"_blank\" href=\"https://java.com\">Get Java</a></li></ol>';
$string['nohtml5'] = 'JSmol requires HTML5. Your browser does not support HTML5. Please try one of the following:<ol><li>Select Jmol which uses Java display technology</li><li>Use a recent browser version that supports HTML5</li></ol>';
$string['nobinary'] = 'Your browser does not support binary file loading via JavaScript. Please try one of the following:<ol><li>Select Jmol which uses Java display technology which supports binary file</li><li>Use a recent browser version that supports binary file loading via JavaScript</li></ol>';
$string['nowebgl'] = 'GLmol requires WebGL. Your browser and/or platform does not currently support WebGL. Please try one of the following:<ol><li>Select a different display technology JSmol (HTML5) or Jmol (Java) from the menu</li><li><a target=\"_blank\" href=\"https://get.webgl.org\">Get WebGL</a></li></ol>';
// Groups.
$string['group'] = 'Group';
$string['group1'] = 'Group1, the alkali metals';
$string['group2'] = 'Group2, the alkaline earth metals';
$string['group3'] = 'Group3, the scandium group including the lanthanoids and actinoids';
$string['group4'] = 'Group4, the titanium group ';
$string['group5'] = 'Group5, the vanadium group ';
$string['group6'] = 'Group6, the chromium group ';
$string['group7'] = 'Group7, the manganese group ';
$string['group8'] = 'Group8, the iron group ';
$string['group9'] = 'Group9, the cobalt group ';
$string['group10'] = 'Group10, the nickel group ';
$string['group11'] = 'Group11, the copper group, coinage metals ';
$string['group12'] = 'Group12, the zinc group ';
$string['group13'] = 'Group13, the boron group';
$string['group14'] = 'Group14, the carbon group';
$string['group15'] = 'Group15, the pnictogens, nitrogen group';
$string['group16'] = 'Group16, the chalcogens, oxygen group';
$string['group17'] = 'Group17, the halogens';
$string['group18'] = 'Group18, the noble gases';
$string['sblock'] = 's-block';
$string['pblock'] = 'p-block';
$string['dblock'] = 'd-block';
$string['fblock'] = 'f-block';
$string['transitionelements'] = 'transition elements';
$string['lanthanoids'] = 'lanthanoids';
$string['actinoids'] = 'actinoids';
// Elements.
$string['hydrogen'] = 'Hydrogen';
$string['helium'] = 'Helium';
$string['lithium'] = 'Lithium';
$string['beryllium'] = 'Beryllium';
$string['boron'] = 'Boron';
$string['carbon'] = 'Carbon';
$string['nitrogen'] = 'Nitrogen';
$string['oxygen'] = 'Oxygen';
$string['fluorine'] = 'Fluorine';
$string['neon'] = 'Neon';
$string['sodium'] = 'Sodium';
$string['magnesium'] = 'Magnesium';
$string['aluminium'] = 'Aluminium';
$string['silicon'] = 'Silicon';
$string['phosphorus'] = 'Phosphorus';
$string['sulphur'] = 'Sulphur';
$string['chlorine'] = 'Chlorine';
$string['argon'] = 'Argon';
$string['potassium'] = 'Potassium';
$string['calcium'] = 'Calcium';
$string['scandium'] = 'Scandium';
$string['titanium'] = 'Titanium';
$string['vanadium'] = 'Vanadium';
$string['chromium'] = 'Chromium';
$string['manganese'] = 'Manganese';
$string['iron'] = 'Iron';
$string['cobalt'] = 'Cobalt';
$string['nickel'] = 'Nickel';
$string['copper'] = 'Copper';
$string['zinc'] = 'Zinc';
$string['gallium'] = 'Gallium';
$string['germanium'] = 'Germanium';
$string['arsenic'] = 'Arsenic';
$string['selenium'] = 'Selenium';
$string['bromine'] = 'Bromine';
$string['krypton'] = 'Krypton';
$string['rubidium'] = 'Rubidium';
$string['strontium'] = 'Strontium';
$string['yttrium'] = 'Yttrium';
$string['zirconium'] = 'Zirconium';
$string['niobium'] = 'Niobium';
$string['molybdenum'] = 'Molybdenum';
$string['technetium'] = 'Technetium';
$string['ruthenium'] = 'Ruthenium';
$string['rhodium'] = 'Rhodium';
$string['palladium'] = 'Palladium';
$string['silver'] = 'Silver';
$string['cadmium'] = 'Cadmium';
$string['indium'] = 'Indium';
$string['tin'] = 'Tin';
$string['antimony'] = 'Antimony';
$string['tellurium'] = 'Tellurium';
$string['iodine'] = 'Iodine';
$string['xenon'] = 'Xenon';
$string['caesium'] = 'Caesium';
$string['barium'] = 'Barium';
$string['lutetium'] = 'Lutetium';
$string['hafnium'] = 'Hafnium';
$string['tantalum'] = 'Tantalum';
$string['tungsten'] = 'Tungsten';
$string['rhenium'] = 'Rhenium';
$string['osmium'] = 'Osmium';
$string['iridium'] = 'Iridium';
$string['platinum'] = 'Platinum';
$string['gold'] = 'Gold';
$string['mercury'] = 'Mercury';
$string['thallium'] = 'Thallium';
$string['lead'] = 'Lead';
$string['bismuth'] = 'Bismuth';
$string['polonium'] = 'Polonium';
$string['astatine'] = 'Astatine';
$string['radon'] = 'Radon';
$string['francium'] = 'Francium';
$string['radium'] = 'Radium';
$string['lawrencium'] = 'Lawrencium';
$string['rutherfordium'] = 'Rutherfordium';
$string['dubnium'] = 'Dubnium';
$string['seaborgium'] = 'Seaborgium';
$string['bohrium'] = 'Bohrium';
$string['hassium'] = 'Hassium';
$string['meitnerium'] = 'Meitnerium';
$string['darmstadtium'] = 'Darmstadtium';
$string['roentgenium'] = 'Roentgenium';
$string['copernicium'] = 'Copernicium';
$string['lanthanum'] = 'Lanthanum';
$string['cerium'] = 'Cerium';
$string['praseodymium'] = 'Praseodymium';
$string['neodymium'] = 'Neodymium';
$string['promethium'] = 'Promethium';
$string['samarium'] = 'Samarium';
$string['europium'] = 'Europium';
$string['gadolinium'] = 'Gadolinium';
$string['terbium'] = 'Terbium';
$string['dysprosium'] = 'Dysprosium';
$string['holmium'] = 'Holmium';
$string['erbium'] = 'Erbium';
$string['thulium'] = 'Thulium';
$string['ytterbium'] = 'Ytterbium';
$string['actinium'] = 'Actinium';
$string['thorium'] = 'Thorium';
$string['protoactinium'] = 'Protoactinium';
$string['uranium'] = 'Uranium';
$string['neptunium'] = 'Neptunium';
$string['plutonium'] = 'Plutonium';
$string['americium'] = 'Americium';
$string['curium'] = 'Curium';
$string['berkelium'] = 'Berkelium';
$string['californium'] = 'Californium';
$string['einsteinium'] = 'Einsteinium';
$string['fermium'] = 'Fermium';
$string['mendelevium'] = 'Mendelevium';
$string['nobelium'] = 'Nobelium';
// Amino acids.
$string['alanine'] = 'Alanine';
$string['arginine'] = 'Arginine';
$string['asparagine'] = 'Asparagine';
$string['aspartic'] = 'Aspartic acid';
$string['cysteine'] = 'Cysteine';
$string['cystine'] = 'Cystine';
$string['glutamine'] = 'Glutamine';
$string['glutamic'] = 'Glutamic acid';
$string['glycine'] = 'Glycine';
$string['histidine'] = 'Histidine';
$string['isoleucine'] = 'Isoleucine';
$string['leucine'] = 'Leucine';
$string['lysine'] = 'Lysine';
$string['methionine'] = 'Methionine';
$string['phenylalanine'] = 'Phenylalanine';
$string['proline'] = 'Proline';
$string['serine'] = 'Serine';
$string['threonine'] = 'Threonine';
$string['tryptophan'] = 'Tryptophan';
$string['tyrosine'] = 'Tyrosine';
$string['valine'] = 'Valine';
$string['other'] = 'Other';
// Bases.
$string['adenine'] = 'Adenine';
$string['guanine'] = 'Guanine';
$string['inosine'] = 'Inosine';
$string['cytosine'] = 'Cytosine';
$string['thymine'] = 'Thymine';
$string['uracil'] = 'Uracil';
