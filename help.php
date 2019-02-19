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

require_once("../../config.php");
global $CFG;
// Elements.
$hydrogen = get_string('hydrogen', 'filter_jmol');
$helium = get_string('helium', 'filter_jmol');
$lithium = get_string('lithium', 'filter_jmol');
$beryllium = get_string('beryllium', 'filter_jmol');
$boron = get_string('boron', 'filter_jmol');
$carbon = get_string('carbon', 'filter_jmol');
$nitrogen = get_string('nitrogen', 'filter_jmol');
$oxygen = get_string('oxygen', 'filter_jmol');
$fluorine = get_string('fluorine', 'filter_jmol');
$neon = get_string('neon', 'filter_jmol');
$sodium = get_string('sodium', 'filter_jmol');
$magnesium = get_string('magnesium', 'filter_jmol');
$aluminium = get_string('aluminium', 'filter_jmol');
$silicon = get_string('silicon', 'filter_jmol');
$phosphorus = get_string('phosphorus', 'filter_jmol');
$sulphur = get_string('sulphur', 'filter_jmol');
$chlorine = get_string('chlorine', 'filter_jmol');
$argon = get_string('argon', 'filter_jmol');
$potassium = get_string('potassium', 'filter_jmol');
$calcium = get_string('calcium', 'filter_jmol');
$scandium = get_string('titanium', 'filter_jmol');
$titanium = get_string('hydrogen', 'filter_jmol');
$vanadium = get_string('vanadium', 'filter_jmol');
$chromium = get_string('chromium', 'filter_jmol');
$manganese = get_string('manganese', 'filter_jmol');
$iron = get_string('iron', 'filter_jmol');
$cobalt = get_string('cobalt', 'filter_jmol');
$nickel = get_string('nickel', 'filter_jmol');
$copper = get_string('copper', 'filter_jmol');
$zinc = get_string('zinc', 'filter_jmol');
$gallium = get_string('gallium', 'filter_jmol');
$germanium = get_string('germanium', 'filter_jmol');
$arsenic = get_string('arsenic', 'filter_jmol');
$selenium = get_string('selenium', 'filter_jmol');
$bromine = get_string('bromine', 'filter_jmol');
$krypton = get_string('krypton', 'filter_jmol');
$rubidium = get_string('rubidium', 'filter_jmol');
$strontium = get_string('strontium', 'filter_jmol');
$yttrium = get_string('yttrium', 'filter_jmol');
$zirconium = get_string('zirconium', 'filter_jmol');
$niobium = get_string('niobium', 'filter_jmol');
$molybdenum = get_string('molybdenum', 'filter_jmol');
$technetium = get_string('technetium', 'filter_jmol');
$ruthenium = get_string('ruthenium', 'filter_jmol');
$rhodium = get_string('rhodium', 'filter_jmol');
$palladium = get_string('palladium', 'filter_jmol');
$silver = get_string('silver', 'filter_jmol');
$cadmium = get_string('cadmium', 'filter_jmol');
$indium = get_string('indium', 'filter_jmol');
$tin = get_string('tin', 'filter_jmol');
$antimony = get_string('antimony', 'filter_jmol');
$tellurium = get_string('tellurium', 'filter_jmol');
$iodine = get_string('iodine', 'filter_jmol');
$xenon = get_string('xenon', 'filter_jmol');
$caesium = get_string('caesium', 'filter_jmol');
$barium = get_string('barium', 'filter_jmol');
$lutetium = get_string('lutetium', 'filter_jmol');
$hafnium = get_string('hafnium', 'filter_jmol');
$tantalum = get_string('tantalum', 'filter_jmol');
$tungsten = get_string('tungsten', 'filter_jmol');
$rhenium = get_string('rhenium', 'filter_jmol');
$osmium = get_string('osmium', 'filter_jmol');
$iridium = get_string('iridium', 'filter_jmol');
$platinum = get_string('platinum', 'filter_jmol');
$gold = get_string('gold', 'filter_jmol');
$mercury = get_string('mercury', 'filter_jmol');
$thallium = get_string('thallium', 'filter_jmol');
$lead = get_string('lead', 'filter_jmol');
$bismuth = get_string('bismuth', 'filter_jmol');
$polonium = get_string('polonium', 'filter_jmol');
$astatine = get_string('astatine', 'filter_jmol');
$radon = get_string('radon', 'filter_jmol');
$francium = get_string('francium', 'filter_jmol');
$radium = get_string('radium', 'filter_jmol');
$lawrencium = get_string('lawrencium', 'filter_jmol');
$rutherfordium = get_string('rutherfordium', 'filter_jmol');
$dubnium = get_string('dubnium', 'filter_jmol');
$seaborgium = get_string('seaborgium', 'filter_jmol');
$bohrium = get_string('bohrium', 'filter_jmol');
$hassium = get_string('hassium', 'filter_jmol');
$meitnerium = get_string('meitnerium', 'filter_jmol');
$darmstadtium = get_string('darmstadtium', 'filter_jmol');
$roentgenium = get_string('roentgenium', 'filter_jmol');
$copernicium = get_string('copernicium', 'filter_jmol');
$lanthanum = get_string('lanthanum', 'filter_jmol');
$cerium = get_string('cerium', 'filter_jmol');
$praseodymium = get_string('praseodymium', 'filter_jmol');
$neodymium = get_string('neodymium', 'filter_jmol');
$promethium = get_string('promethium', 'filter_jmol');
$samarium = get_string('samarium', 'filter_jmol');
$europium = get_string('europium', 'filter_jmol');
$gadolinium = get_string('gadolinium', 'filter_jmol');
$terbium = get_string('terbium', 'filter_jmol');
$dysprosium = get_string('dysprosium', 'filter_jmol');
$holmium = get_string('holmium', 'filter_jmol');
$erbium = get_string('erbium', 'filter_jmol');
$thulium = get_string('thulium', 'filter_jmol');
$ytterbium = get_string('ytterbium', 'filter_jmol');
$actinium = get_string('actinium', 'filter_jmol');
$thorium = get_string('thorium', 'filter_jmol');
$protoactinium = get_string('protoactinium', 'filter_jmol');
$uranium = get_string('radium', 'filter_jmol');
$neptunium = get_string('neptunium', 'filter_jmol');
$plutonium = get_string('plutonium', 'filter_jmol');
$americium = get_string('americium', 'filter_jmol');
$curium = get_string('berkelium', 'filter_jmol');
$berkelium = get_string('radium', 'filter_jmol');
$californium = get_string('californium', 'filter_jmol');
$einsteinium = get_string('einsteinium', 'filter_jmol');
$fermium = get_string('fermium', 'filter_jmol');
$mendelevium = get_string('mendelevium', 'filter_jmol');
$nobelium = get_string('nobelium', 'filter_jmol');
// Periodic.
$sblock = get_string('sblock', 'filter_jmol');
$pblock = get_string('pblock', 'filter_jmol');
$dblock = get_string('dblock', 'filter_jmol');
$fblock = get_string('fblock', 'filter_jmol');
$group = get_string('group', 'filter_jmol');
$group1 = get_string('group1', 'filter_jmol');
$group2 = get_string('group2', 'filter_jmol');
$group3 = get_string('group3', 'filter_jmol');
$group4 = get_string('group4', 'filter_jmol');
$group5 = get_string('group5', 'filter_jmol');
$group6 = get_string('group6', 'filter_jmol');
$group7 = get_string('group7', 'filter_jmol');
$group8 = get_string('group8', 'filter_jmol');
$group9 = get_string('group9', 'filter_jmol');
$group10 = get_string('group10', 'filter_jmol');
$group11 = get_string('group11', 'filter_jmol');
$group12 = get_string('group12', 'filter_jmol');
$group13 = get_string('group13', 'filter_jmol');
$group14 = get_string('group14', 'filter_jmol');
$group15 = get_string('group15', 'filter_jmol');
$group16 = get_string('group16', 'filter_jmol');
$group17 = get_string('group17', 'filter_jmol');
$group18 = get_string('group18', 'filter_jmol');
$transitionelements = get_string('transitionelements', 'filter_jmol');
$lanthanoids = get_string('lanthanoids', 'filter_jmol');
$actinoids = get_string('actinoids', 'filter_jmol');

// Biological macromolecules: amino acids.
$alanine = get_string('alanine', 'filter_jmol');
$arginine = get_string('arginine', 'filter_jmol');
$asparagine = get_string('asparagine', 'filter_jmol');
$aspartic = get_string('aspartic', 'filter_jmol');
$cysteine = get_string('cysteine', 'filter_jmol');
$cystine = get_string('cystine', 'filter_jmol');
$glutamine = get_string('glutamine', 'filter_jmol');
$glutamic = get_string('glutamic', 'filter_jmol');
$glycine = get_string('glycine', 'filter_jmol');
$histidine = get_string('histidine', 'filter_jmol');
$isoleucine = get_string('isoleucine', 'filter_jmol');
$leucine = get_string('leucine', 'filter_jmol');
$lysine = get_string('lysine', 'filter_jmol');
$methionine = get_string('methionine', 'filter_jmol');
$phenylalanine = get_string('phenylalanine', 'filter_jmol');
$proline = get_string('proline', 'filter_jmol');
$serine = get_string('serine', 'filter_jmol');
$threonine = get_string('threonine', 'filter_jmol');
$tryptophan = get_string('tryptophan', 'filter_jmol');
$tyrosine = get_string('tyrosine', 'filter_jmol');
$valine = get_string('valine', 'filter_jmol');
$aspartic = get_string('aspartic', 'filter_jmol');
$glutamic = get_string('glutamic', 'filter_jmol');
$other = get_string('other', 'filter_jmol');

// Nucleotide_base_residues.
$adenine = get_string('adenine', 'filter_jmol');
$guanine = get_string('guanine', 'filter_jmol');
$inosine = get_string('inosine', 'filter_jmol');
$cytosine = get_string('cytosine', 'filter_jmol');
$thymine = get_string('thymine', 'filter_jmol');
$uracil = get_string('uracil', 'filter_jmol');

echo '<!DOCTYPE html>
<html>
﻿<head>
<title>Jmol help</title>
<link rel="stylesheet" type="text/css" href="help.css" />
</head>
<body>
<h1>Jmol help</h1>
<h2>Jmol default colours</h2>
<h3>Elements</h3>
<p>Hover over any element to see more information (Atomic Number, Symbol, Element Name)</p>
<table>
    <tr>
    <th title="'.$group1.'">1</th>
    <th title="'.$group2.'">2</th>
    <th></th>
    <th title="'.$group3.'">3</th>
    <th title="'.$group4.'">4</th>
    <th title="'.$group5.'">5</th>
    <th title="'.$group6.'">6</th>
    <th title="'.$group7.'">7</th>
    <th title="'.$group8.'">8</th>
    <th title="'.$group9.'">9</th>
    <th title="'.$group10.'">10</th>
    <th title="'.$group11.'">11</th>
    <th title="'.$group12.'">12</th>
    <th title="'.$group13.'">13</th>
    <th title="'.$group14.'">14</th>
    <th title="'.$group15.'">15</th>
    <th title="'.$group16.'">16</th>
    <th title="'.$group17.'">17</th>
    <th title="'.$group18.'">18</th>
    </tr>
    <tr>
      <td id="hydrogen" title="1 H '.$hydrogen.'">H</td>
      <td colspan="17"></td>
      <td id ="helium" title="2 He '.$helium.'">He</td>
    </tr>
    <tr>
    <td colspan="2" class="block">'.$sblock.'</td>
    <td colspan="11"></td>
    <td colspan="6" class="block">'.$pblock.'</td>
    </tr>
    <tr>
      <td id="lithium" title="3 Li '.$lithium.'">Li</td>
      <td id="beryllium" title="4 Be '.$beryllium.'">Be</td>
      <td colspan="11"></td>
      <td id="boron" title="5 B '.$boron.'">B</td>
      <td id="carbon" title="6 C '.$carbon.'">C</td>
      <td id="nitrogen" title="7 N '.$nitrogen.'">N</td>
      <td id="oxygen" title="8 O '.$oxygen.'">O</td>
      <td id="fluorine" title="9 F '.$fluorine.'">F</td>
      <td id="neon" title="10 Ne '.$neon.'">Ne</td>
    </tr>
    <tr>
      <td id="sodium" title="11 Na '.$sodium.'">Na</td>
      <td id="magnesium" title="12 Mg '.$magnesium.'">Mg</td>
      <td></td>
      <td colspan="10" class="block">'.$dblock.'</td>
      <td id="aluminium" title="13 Al '.$aluminium.'">Al</td>
      <td id="silicon" title="14 Si '.$silicon.'">Si</td>
      <td id="phosphorus" title="15 P '.$phosphorus.'">P</td>
      <td id="sulphur" title="16 S '.$sulphur.'">S</td>
      <td id="chlorine" title="17 Cl '.$chlorine.'">Cl</td>
      <td id="argon" title="18 Ar '.$argon.'">Ar</td>
    </tr>
    <tr>
      <td id="potassium" title="19 K '.$potassium.'">K</td>
      <td id="calcium" title="20 Ca '.$calcium.'">Ca</td>
      <td></td>
      <td id="scandium" title="21 Sc '.$scandium.'">Sc</td>
      <td id="titanium" title="22 Ti '.$titanium.'">Ti</td>
      <td id="vanadium" title="23 V '.$vanadium.'">V</td>
      <td id="chromium" title="24 Cr '.$chromium.'">Cr</td>
      <td id="manganese" title="25 Mn '.$manganese.'">Mn</td>
      <td id="iron" title="26 Fe '.$iron.'">Fe</td>
      <td id="cobalt" title="27 Co '.$cobalt.'">Co</td>
      <td id= "nickel" title="28 Ni '.$nickel.'">Ni</td>
      <td id="copper" title="29 Cu '.$copper.'">Cu</td>
      <td id="zinc" title="30 Zn '.$zinc.'">Zn</td>
      <td id="gallium" title="31 Ga '.$gallium.'">Ga</td>
      <td id="germanium" title="32 Ge '.$germanium.'">Ge</td>
      <td id="arsenic" title="33 As '.$arsenic.'">As</td>
      <td id="selenium" title="34 Se '.$selenium.'">Se</td>
      <td id="bromine" title="35 Br '.$bromine.'">Br</td>
      <td id="krypton" title="36 Kr '.$krypton.'">Kr</td>
    </tr>
    <tr>
      <td id="rubidium" title="37 Rb '.$rubidium.'">Rb</td>
      <td id="strontium" title="38 Sr '.$strontium.'">Sr</td>
      <td></td>
      <td id="yttrium" title="39 Y '.$yttrium.'">Y</td>
      <td id="zirconium" title="40 Zr '.$zirconium.'">Zr</td>
      <td id="niobium" title="41 Nb '.$niobium.'">Nb</td>
      <td id="molybdenum" title="42 Mo '.$molybdenum.'">Mo</td>
      <td id="technetium" title="43 Tc '.$technetium.'">Tc</td>
      <td id="ruthenium" title="44 Ru '.$ruthenium.'">Ru</td>
      <td id="rhodium" title="45 Rh '.$rhodium.'">Rh</td>
      <td id="palladium" title="46 Pd '.$palladium.'">Pd</td>
      <td id="silver" title="47 Ag '.$silver.'">Ag</td>
      <td id="cadmium" title="48 Cd '.$cadmium.'">Cd</td>
      <td id="indium" title="49 In '.$indium.'">In</td>
      <td id="tin" title="50 Sn '.$tin.'">Sn</td>
      <td id="antimony" title="51 Sb '.$antimony.'">Sb</td>
      <td id="tellurium" title="52 Te '.$tellurium.'">Te</td>
      <td id="iodine" title="53 I '.$iodine.'">I</td>
      <td id="xenon" title="54 Xe '.$xenon.'">Xe</td>
    </tr>
    <tr>
      <td id="caesium" title="55 Cs '.$caesium.'">Cs</td>
      <td id="barium" title="56 Ba '.$barium.'">Ba</td>
      <td title="'.$lanthanoids.'">*</td>
      <td id="lutetium" title="71 Lu '.$lutetium.'">Lu</td>
      <td id="hafnium" title="72 Hf '.$hafnium.'">Hf</td>
      <td id="tantalum" title="73 Ta '.$tantalum.'">Ta</td>
      <td id="tungsten" title="74 W '.$tungsten.'">W</td>
      <td id="rhenium" title="75 Re '.$rhenium.'">Re</td>
      <td id="osmium" title="76 Os '.$osmium.'">Os</td>
      <td id="iridium" title="77 Ir '.$iridium.'">Ir</td>
      <td id="platinum" title="78 Pt '.$platinum.'">Pt</td>
      <td id="gold" title="79 Au '.$gold.'">Au</td>
      <td id="mercury" title="80 Hg '.$mercury.'">Hg</td>
      <td id="thallium" title="81 Tl '.$thallium.'">Tl</td>
      <td id="lead" title="82 Pb '.$lead.'">Pb</td>
      <td id="bismuth" title="83 Bi '.$bismuth.'">Bi</td>
      <td id="polonium" title="84 Po '.$polonium.'">Po</td>
      <td id="astatine" title="85 At '.$astatine.'">At</td>
      <td id="radon" title="86 Rn '.$radon.'">Rn</td>
    </tr>
    <tr>
      <td id="francium" title="87 Fr '.$francium.'">Fr</td>
      <td id="radium" title="88 Ra '.$radium.'">Ra</td>
      <td title="'.$actinoids.'">**</td>
      <td id="lawrencium" title="103 Lr '.$lawrencium.'">Lr</td>
      <td id="rutherfordium" title="104 Rf '.$rutherfordium.'">Rf</td>
      <td id="dubnium" title="105 Db '.$dubnium.'">Db</td>
      <td id="seaborgium" title="106 Sg '.$seaborgium.'">Sg</td>
      <td id="bohrium" title="107 Bh '.$bohrium.'">Bh</td>
      <td id="hassium" title="108 Hs '.$hassium.'">Hs</td>
      <td id="meitnerium" title="109 Mt '.$meitnerium.'">Mt</td>
      <td id="darmstadtium" title="110 Ds '.$darmstadtium.'">Ds</td>
      <td id="roentgenium" title="111 Rg '.$roentgenium.'">Rg</td>
      <td id="copernicium" title="112 Cn '.$copernicium.'">Cn</td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <td colspan="3"></td>
      <td colspan="14" class="block" style="height:2em; font-size:0.75em; text-align:left">'.$fblock.'</td>
      <td colspan="2"></td
    </tr>
    <tr>
      <td colspan="2"></td>
      <td title="'.$lanthanoids.'">*</td>
      <td id="lanthanum" title="57 La '.$lanthanum.'">La</td>
      <td id="cerium" title="58 Ce '.$cerium.'">Ce</td>
      <td id="praseodymium" title="59 Pr '.$praseodymium.'">Pr</td>
      <td id="neodymium" title="60 Nd '.$neodymium.'">Nd</td>
      <td id="promethium" title="61 Pm '.$promethium.'">Pm</td>
      <td id="samarium" title="62 Sm '.$samarium.'">Sm</td>
      <td id="europium" title="63 Eu '.$europium.'">Eu</td>
      <td id="gadolinium" title="64 Gd '.$gadolinium.'">Gd</td>
      <td id="terbium" title="65 Tb '.$terbium.'">Tb</td>
      <td id="dysprosium" title="66 Dy '.$dysprosium.'">Dy</td>
      <td id="holmium" title="67 Ho '.$holmium.'">Ho</td>
      <td id="erbium" title="68 Er '.$erbium.'">Er</td>
      <td id="thulium" title="69 Tm '.$thulium.'">Tm</td>
      <td id="ytterbium" title="70 Yb '.$ytterbium.'">Yb</td>
      <td colspan="2"></td>
    </tr>
    <tr>
      <td></td>
      <td></td>
      <td id="" title="'.$actinoids.'">**</td>
      <td id="actinium" title="89 Ac '.$actinium.'">Ac</td>
      <td id="thorium" title="90 Th '.$thorium.'">Th</td>
      <td id="protoactinium" title="91 Pa '.$protoactinium.'">Pa</td>
      <td id="uranium" title="92 U '.$uranium.'">U</td>
      <td id="neptunium" title="93 Np '.$neptunium.'">Np</td>
      <td id="plutonium" title="94 Pu '.$plutonium.'">Pu</td>
      <td id="americium" title="95 Am '.$americium.'">Am</td>
      <td id="curium" title="96 Cm '.$curium.'">Cm</td>
      <td id="berkelium" title="97 Bk '.$berkelium.'" style="padding:2px; ">Bk</td>
      <td id="californium" title="98 Cf '.$californium.'">Cf</td>
      <td id="einsteinium" title="99 Es '.$einsteinium.'">Es</td>
      <td id="fermium" title="100 Fm '.$fermium.'">Fm</td>
      <td id="mendelevium" title="101 Md '.$mendelevium.'">Md</td>
      <td id="nobelium" title="102 No '.$nobelium.'">No</td>
      <td></td>
      <td></td>
    </tr>
</table>
<br />
<h3> <span class="mw-headline" id="Biological_macromolecules"> Biological macromolecules </span></h3>
<h4> <span class="mw-headline" id="Primary_structure"> Primary structure </span></h4>
<h5> <span class="mw-headline" id="Amino_acid_residues"> Amino acid residues </span></h5>
<table style="text-align: center;">
<tr>
<td title="'.$alanine.'" style="width: 2em; background-color: #8CFF8C;"> Ala
</td>
<td title="'.$arginine.'" style="width: 2em; background-color: #00007C;"> Arg
</td>
<td title="'.$asparagine.'" style="width: 2em; background-color: #00A1FF;"> Asn
</td>
<td title="'.$aspartic.'" style="width: 2em; background-color: #A00042"> Asp
</td>
<td title="'.$cystine.'" style="width: 2em; background-color: #A00042;"> Cys
</td>
<td title="'.$glutamine.'" style="width: 2em; background-color: #006BFF;"> Gln
</td>
<td title="'.$glutamic.'" style="width: 2em; background-color: #FF4C4C;"> Glu
</td>
<td title="'.$glycine.'" style="width: 2em; background-color: #FFFFFF; border:1px solid lightgray;"> Gly
</td>
<td title="'.$histidine.'" style="width: 2em; background-color: #7070FF;"> His
</td>
<td title="'.$isoleucine.'" style="width: 2em; background-color: #004C00;"> Ile
</td>
<td title="'.$leucine.'" style="width: 2em; background-color: #455E45;"> Leu
</td>
<td title="'.$lysine.'" style="width: 2em; background-color: #4747B8;"> Lys
</td>
<td title="'.$methionine.'" style="width: 2em;background-color: #B8A042;"> Met
</td>
<td title="'.$phenylalanine.'" style="width: 2em; background-color: #534C52;"> Phe
</td>
<td title="'.$proline.'" style="width: 2em; background-color: #525252;"> Pro
</td>
<td title="'.$serine.'" style="width: 2em; background-color: #FF7042;"> Ser
</td>
<td title="'.$threonine.'" style="width: 2em; background-color: #B84C00;"> Thr
</td>
<td title="'.$tryptophan.'" style="width: 2em; background-color: #4F4600;"> Trp
</td>
<td title="'.$tyrosine.'" style="width: 2em; background-color: #8C704C;"> Tyr
</td>
<td title="'.$valine.'" style="width: 2em; background-color: #FF8CFF;"> Val
</td>
<td title="'.$aspartic.' or '.$asparagine.'" style="width: 2em; background-color: #FF00FF;"> Asx
</td>
<td title="'.$glutamic.' or '.$glutamine.'" style="width: 2em; background-color: #FF00FF;"> Glx
</td>
<td title="'.$other.'" style="width: 2em; background-color: #FF00FF;"> Xxx
</td></tr></table>
<h5> <span class="mw-headline" id="Nucleotide_base_residues"> Nucleotide base residues </span></h5>
<table>
<tr>
<td title="'.$adenine.'" style="width:2em; background-color: #A0A0FF; text-align: center;"> A
</td>
<td title="'.$guanine.'" style="width:2em; background-color: #FF7070; text-align: center;"> G
</td>
<td title="'.$inosine.'" style="width:2em; background-color: #80FFFF; text-align: center;"> I
</td>
<td title="'.$cytosine.'" style="width:2em; background-color: #FF8C4B; text-align: center;"> C
</td>
<td title="'.$thymine.'" style="width:2em; background-color: #A0FFA0; text-align: center;"> T
</td>
<td title="'.$uracil.'" style="width:2em; background-color: #FF8080; text-align: center;"> U
</td></tr></table>
<h4> <span class="mw-headline" id="Secondary_structure"> Secondary structure</span></h4>
<h5> <span class="mw-headline" id="Polypeptides"> Polypeptides </span></h5>
<table>
<tr>
<td style="width:5em; background-color: #FF0080; text-align: center;">α helix
</td>
<td style="width:5em; background-color: #A00080; text-align: center;">3<sub>10</sub> helix
</td>
<td style="width:5em; background-color: #600080; text-align: center;">π helix
</td>
<td style="width:5em; background-color: #FFC800; text-align: center;">β strand
</td>
<td style="width:5em; background-color: #6080FF; text-align: center;">(β) turn
</td>
<td style="width:5em; background-color: #FFFFFF; text-align: center; border:1px solid lightgray;"> other
</td>
<td style="width:5em; background-color: #FFFFFF; text-align: center;">
</td>
<td style="width:5em; background-color: #AE00FE; text-align: center;">DNA
</td>
<td style="width:5em; background-color: #FD0162; text-align: center;">RNA
</td>
<td style="width:5em; background-color: #FFFFFF; text-align: center; border:1px solid lightgray;">other
</td>
<td style="width:5em; background-color: #FFFFFF; text-align: center;">
</td>
<td style="width:5em; background-color: #A6A6FA; text-align: center;">carbo<wbr>hydrate
</td>
<td style="width:5em; background-color: #808080; text-align: center;">other
</td></tr></table>
<h5> <span class="mw-headline" id="Nucleic_acids"> Nucleic acids </span></h5>
<h4> <span class="mw-headline" id="Tertiary_structure"> Tertiary structure </span></h4>
<h5> <span class="mw-headline" id="Polypeptides_and_nucleic_acids"> Polypeptides and nucleic acids </span></h5>
<table style="border-spacing:0;border-collapse:collapse">

<tr>
<td colspan="16" style="text-align:left">N-terminal or 5’-
</td>
<td>
</td>
<td colspan="16" style="text-align:right">C-terminal or 3’-
</td></tr>
<tr style="height:1em">
<td style="width:1em; background-color:#0000ff">
</td>
<td style="width:1em; background-color:#0020ff">
</td>
<td style="width:1em; background-color:#0040ff">
</td>
<td style="width:1em; background-color:#0060ff">
</td>
<td style="width:1em; background-color:#0080ff">
</td>
<td style="width:1em; background-color:#00a0ff">
</td>
<td style="width:1em; background-color:#00c0ff">
</td>
<td style="width:1em; background-color:#00e0ff">
</td>
<td style="width:1em; background-color:#00ffff">
</td>
<td style="width:1em; background-color:#00ffe0">
</td>
<td style="width:1em; background-color:#00ffc0">
</td>
<td style="width:1em; background-color:#00ffa0">
</td>
<td style="width:1em; background-color:#00ff80">
</td>
<td style="width:1em; background-color:#00ff60">
</td>
<td style="width:1em; background-color:#00ff40">
</td>
<td style="width:1em; background-color:#00ff20">
</td>
<td style="width:1em; background-color:#00ff00">
</td>
<td style="width:1em; background-color:#20ff00">
</td>
<td style="width:1em; background-color:#40ff00">
</td>
<td style="width:1em; background-color:#60ff00">
</td>
<td style="width:1em; background-color:#80ff00">
</td>
<td style="width:1em; background-color:#a0ff00">
</td>
<td style="width:1em; background-color:#c0ff00">
</td>
<td style="width:1em; background-color:#e0ff00">
</td>
<td style="width:1em; background-color:#ffff00">
</td>
<td style="width:1em; background-color:#ffe000">
</td>
<td style="width:1em; background-color:#ffc000">
</td>
<td style="width:1em; background-color:#ffa000">
</td>
<td style="width:1em; background-color:#ff8000">
</td>
<td style="width:1em; background-color:#ff6000">
</td>
<td style="width:1em; background-color:#ff4000">
</td>
<td style="width:1em; background-color:#ff2000">
</td>
<td style="width:1em; background-color:#ff0000">
</td></tr></table>
<p>A reverse rainbow gradient (bgyor) is used to color according to
position of the corresponding groups or residues
(for example, amino acids or nucleotides) along a chain.</p>
<h2>Jmol mouse control</h3>
<p>Jmol controls for 1-button (e.g. Macintosh), 2-button (e.g. Windows),
3-button (e.g. Linux), or wheel mice.</p>
<table class="mouse">
    <tr>
      <th class="mouse">Action</th>
      <th class="mouse">Main (left) button</th>
      <th class="mouse">Middle button</th>
      <th class="mouse">Secondary (right) button</th>
    </tr>
    <tr>
      <th class="mouse">Jmol menu</td>
      <td class="mouse">Ctrl + click</td>
      <td class="mouse">&nbsp;</td>
      <td class="mouse">Click</td>
    </tr>
    <tr>
      <th class="mouse">Rotate X,Y</td>
      <td class="mouse">Click &amp; drag</td>
      <td class="mouse">&nbsp;</td>
      <td class="mouse">&nbsp;</td>
    </tr>
    <tr>
      <th class="mouse">Translate X,Y</td>
      <td class="mouse">Shift + double-click &amp; drag</td>
      <td class="mouse">Double-click &amp; drag</td>
      <td class="mouse">Ctrl + click &amp; drag</td>
    </tr>
    <tr>
      <th class="mouse">Rotate Z</td>
      <td class="mouse">Shift + click &amp; drag horizontally</td>
      <td class="mouse">Click &amp; drag horizontally</td>
      <td class="mouse">Shift + click &amp; drag horizontally</td>
    </tr>
    <tr>
      <th class="mouse">Zoom </td>
      <td class="mouse">Click &amp; drag vertically near right-hand edge<br>
      <span style="font-style: italic;">or</span> Shift + click &amp; drag vertically</td>
      <td class="mouse">Click &amp; drag vertically<br>
      <span style="font-style: italic;">or</span> mouse wheel </td>
      <td class="mouse">&nbsp;</td>
    </tr>
    <tr>
      <th class="mouse">Reset &amp; centre</td>
      <td class="mouse">Shift + double-click (away from molecule)</td>
      <td class="mouse">Double-click (away from molecule) </td>
      <td class="mouse">&nbsp;</td>
    </tr>
</table>
<h2>Jmol measurements</h3>
<ul>
  <li>Distance (2 atoms):
    <ol>
      <li>double-click on the starting atom</li>
      <li>to fix a distance measurement, double-click on second atom</li>
    </ol>
  </li>
  <br />
  <li>Angle (3 atoms):
    <ol>
      <li>double-click on the starting atom</li>
      <li>click on the second atom (central atom in angle)</li>
      <li>to fix an angle measurement, double-click on third atom</li>
    </ol>
  </li>
  <br />
  <li>Torsion angle or dihedral (4 atoms)
    <ol>
      <li>double-click on the starting atom</li>
      <li>click on the second atom</li>
      <li>click on the third atom</li>
      <li>to fix a dihedral angle measurement, double-click on fourth atom</li>
    </ol>
  </li>
  <br />
  <li>In all cases:
    <ul>
      <li>move pointer over destination atom in order to see measurement results without leaving a permanent measurement</li>
      <li>move outside the window in order to cancel the measurement</li>
      <li>make the same measurement again in order to delete the measurement</li>
    </ul>
  </li>
</ul>
<p>For further information see: <a target="_blank" href="http://jmol.sourceforge.net">http://jmol.sourceforge.net</a></p>
</body>
</html>
';
