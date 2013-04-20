// 
//// J\viewer\ScriptManager.js 
// 
Clazz.declarePackage ("J.viewer");
Clazz.load (["J.api.JmolScriptManager", "J.util.JmolList"], "J.viewer.ScriptManager", ["java.lang.Boolean", "$.Thread", "J.api.Interface", "J.thread.CommandWatcherThread", "$.ScriptQueueThread", "J.util.Logger", "$.SB", "$.TextFormat"], function () {
c$ = Clazz.decorateAsClass (function () {
this.viewer = null;
this.eval = null;
this.evalTemp = null;
this.queueThreads = null;
this.scriptQueueRunning = null;
this.commandWatcherThread = null;
this.scriptQueue = null;
this.useCommandWatcherThread = false;
this.scriptIndex = 0;
this.$isScriptQueued = true;
Clazz.instantialize (this, arguments);
}, J.viewer, "ScriptManager", null, J.api.JmolScriptManager);
Clazz.prepareFields (c$, function () {
this.queueThreads =  new Array (2);
this.scriptQueueRunning =  Clazz.newBooleanArray (2, false);
this.scriptQueue =  new J.util.JmolList ();
});
Clazz.overrideMethod (c$, "getEval", 
function () {
return this.eval;
});
Clazz.overrideMethod (c$, "getScriptQueue", 
function () {
return this.scriptQueue;
});
Clazz.overrideMethod (c$, "isScriptQueued", 
function () {
return this.$isScriptQueued;
});
Clazz.makeConstructor (c$, 
function () {
});
Clazz.overrideMethod (c$, "setViewer", 
function (viewer) {
this.viewer = viewer;
this.eval = this.newScriptEvaluator ();
this.eval.setCompiler ();
}, "J.viewer.Viewer");
$_M(c$, "newScriptEvaluator", 
($fz = function () {
return (J.api.Interface.getOptionInterface ("script.ScriptEvaluator")).setViewer (this.viewer);
}, $fz.isPrivate = true, $fz));
Clazz.overrideMethod (c$, "clear", 
function (isAll) {
if (!isAll) {
this.evalTemp = null;
return;
}this.startCommandWatcher (false);
this.interruptQueueThreads ();
}, "~B");
Clazz.overrideMethod (c$, "addScript", 
function (strScript, isScriptFile, isQuiet) {
return this.addScr ("String", strScript, "", isScriptFile, isQuiet);
}, "~S,~B,~B");
$_M(c$, "addScr", 
($fz = function (returnType, strScript, statusList, isScriptFile, isQuiet) {
{
this.useCommandWatcherThread = false;
}if (!this.viewer.global.useScriptQueue) {
this.clearQueue ();
this.viewer.haltScriptExecution ();
}if (this.commandWatcherThread == null && this.useCommandWatcherThread) this.startCommandWatcher (true);
if (this.commandWatcherThread != null && strScript.indexOf ("/*SPLIT*/") >= 0) {
var scripts = J.util.TextFormat.splitChars (strScript, "/*SPLIT*/");
for (var i = 0; i < scripts.length; i++) this.addScr (returnType, scripts[i], statusList, isScriptFile, isQuiet);

return "split into " + scripts.length + " sections for processing";
}var useCommandThread = (this.commandWatcherThread != null && (strScript.indexOf ("javascript") < 0 || strScript.indexOf ("#javascript ") >= 0));
var scriptItem =  new J.util.JmolList ();
scriptItem.addLast (strScript);
scriptItem.addLast (statusList);
scriptItem.addLast (returnType);
scriptItem.addLast (isScriptFile ? Boolean.TRUE : Boolean.FALSE);
scriptItem.addLast (isQuiet ? Boolean.TRUE : Boolean.FALSE);
scriptItem.addLast (Integer.$valueOf (useCommandThread ? -1 : 1));
this.scriptQueue.addLast (scriptItem);
this.startScriptQueue (false);
return "pending";
}, $fz.isPrivate = true, $fz), "~S,~S,~S,~B,~B");
Clazz.overrideMethod (c$, "clearQueue", 
function () {
this.scriptQueue.clear ();
});
Clazz.overrideMethod (c$, "waitForQueue", 
function () {
if (this.viewer.isSingleThreaded) return;
var n = 0;
while (this.queueThreads[0] != null || this.queueThreads[1] != null) {
try {
Thread.sleep (100);
if (((n++) % 10) == 0) if (J.util.Logger.debugging) {
J.util.Logger.info ("...scriptManager waiting for queue: " + this.scriptQueue.size () + " thread=" + Thread.currentThread ().getName ());
}} catch (e) {
if (Clazz.exceptionOf (e, InterruptedException)) {
} else {
throw e;
}
}
}
});
$_M(c$, "flushQueue", 
($fz = function (command) {
for (var i = this.scriptQueue.size (); --i >= 0; ) {
var strScript = (this.scriptQueue.get (i).get (0));
if (strScript.indexOf (command) == 0) {
this.scriptQueue.remove (i);
if (J.util.Logger.debugging) J.util.Logger.debug (this.scriptQueue.size () + " scripts; removed: " + strScript);
}}
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "startScriptQueue", 
($fz = function (startedByCommandWatcher) {
var pt = (startedByCommandWatcher ? 1 : 0);
if (this.scriptQueueRunning[pt]) return;
this.scriptQueueRunning[pt] = true;
this.queueThreads[pt] =  new J.thread.ScriptQueueThread (this, this.viewer, startedByCommandWatcher, pt);
this.queueThreads[pt].start ();
}, $fz.isPrivate = true, $fz), "~B");
Clazz.overrideMethod (c$, "getScriptItem", 
function (watching, isByCommandWatcher) {
if (this.viewer.isSingleThreaded && this.viewer.queueOnHold) return null;
var scriptItem = this.scriptQueue.get (0);
var flag = ((scriptItem.get (5)).intValue ());
var isOK = (watching ? flag < 0 : isByCommandWatcher ? flag == 0 : flag == 1);
return (isOK ? scriptItem : null);
}, "~B,~B");
Clazz.overrideMethod (c$, "startCommandWatcher", 
function (isStart) {
this.useCommandWatcherThread = isStart;
if (isStart) {
if (this.commandWatcherThread != null) return;
this.commandWatcherThread =  new J.thread.CommandWatcherThread (this.viewer, this);
this.commandWatcherThread.start ();
} else {
if (this.commandWatcherThread == null) return;
this.clearCommandWatcherThread ();
}if (J.util.Logger.debugging) {
J.util.Logger.info ("command watcher " + (isStart ? "started" : "stopped") + this.commandWatcherThread);
}}, "~B");
$_M(c$, "interruptQueueThreads", 
function () {
for (var i = 0; i < this.queueThreads.length; i++) {
if (this.queueThreads[i] != null) this.queueThreads[i].interrupt ();
}
});
$_M(c$, "clearCommandWatcherThread", 
function () {
if (this.commandWatcherThread == null) return;
this.commandWatcherThread.interrupt ();
this.commandWatcherThread = null;
});
Clazz.overrideMethod (c$, "queueThreadFinished", 
function (pt) {
this.queueThreads[pt].interrupt ();
this.scriptQueueRunning[pt] = false;
this.queueThreads[pt] = null;
this.viewer.setSyncDriver (4);
}, "~N");
$_M(c$, "runScriptNow", 
function () {
if (this.scriptQueue.size () > 0) {
var scriptItem = this.getScriptItem (true, true);
if (scriptItem != null) {
scriptItem.set (5, Integer.$valueOf (0));
this.startScriptQueue (true);
}}});
Clazz.overrideMethod (c$, "evalStringWaitStatusQueued", 
function (returnType, strScript, statusList, isScriptFile, isQuiet, isQueued) {
if (strScript == null) return null;
var str = this.checkScriptExecution (strScript, false);
if (str != null) return str;
var outputBuffer = (statusList == null || statusList.equals ("output") ?  new J.util.SB () : null);
var oldStatusList = this.viewer.statusManager.getStatusList ();
this.viewer.getStatusChanged (statusList);
if (this.viewer.isSyntaxCheck) J.util.Logger.info ("--checking script:\n" + this.eval.getScript () + "\n----\n");
var historyDisabled = (strScript.indexOf (")") == 0);
if (historyDisabled) strScript = strScript.substring (1);
historyDisabled = historyDisabled || !isQueued;
this.viewer.setErrorMessage (null, null);
var isOK = (isScriptFile ? this.eval.compileScriptFile (strScript, isQuiet) : this.eval.compileScriptString (strScript, isQuiet));
var strErrorMessage = this.eval.getErrorMessage ();
var strErrorMessageUntranslated = this.eval.getErrorMessageUntranslated ();
this.viewer.setErrorMessage (strErrorMessage, strErrorMessageUntranslated);
this.viewer.refresh (7, "script complete");
if (isOK) {
this.$isScriptQueued = isQueued;
if (!isQuiet) this.viewer.setScriptStatus (null, strScript, -2 - (++this.scriptIndex), null);
this.eval.evaluateCompiledScript (this.viewer.isSyntaxCheck, this.viewer.isSyntaxAndFileCheck, historyDisabled, this.viewer.listCommands, outputBuffer, isQueued || !this.viewer.isSingleThreaded);
} else {
this.viewer.scriptStatus (strErrorMessage);
this.viewer.setScriptStatus ("Jmol script terminated", strErrorMessage, 1, strErrorMessageUntranslated);
this.viewer.setStateScriptVersion (null);
}if (strErrorMessage != null && this.viewer.autoExit) this.viewer.exitJmol ();
if (this.viewer.isSyntaxCheck) {
if (strErrorMessage == null) J.util.Logger.info ("--script check ok");
 else J.util.Logger.error ("--script check error\n" + strErrorMessageUntranslated);
J.util.Logger.info ("(use 'exit' to stop checking)");
}this.$isScriptQueued = true;
if (returnType.equalsIgnoreCase ("String")) return strErrorMessageUntranslated;
if (outputBuffer != null) return (strErrorMessageUntranslated == null ? outputBuffer.toString () : strErrorMessageUntranslated);
var info = this.viewer.getStatusChanged (statusList);
this.viewer.getStatusChanged (oldStatusList);
return info;
}, "~S,~S,~S,~B,~B,~B");
$_M(c$, "checkScriptExecution", 
($fz = function (strScript, isInsert) {
var str = strScript;
if (str.indexOf ("\1##") >= 0) str = str.substring (0, str.indexOf ("\1##"));
if (this.checkResume (str)) return "script processing resumed";
if (this.checkStepping (str)) return "script processing stepped";
if (this.checkHalt (str, isInsert)) return "script execution halted";
return null;
}, $fz.isPrivate = true, $fz), "~S,~B");
$_M(c$, "checkResume", 
($fz = function (str) {
if (str.equalsIgnoreCase ("resume")) {
this.viewer.setScriptStatus ("", "execution resumed", 0, null);
this.eval.resumePausedExecution ();
return true;
}return false;
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "checkStepping", 
($fz = function (str) {
if (str.equalsIgnoreCase ("step")) {
this.eval.stepPausedExecution ();
return true;
}if (str.equalsIgnoreCase ("?")) {
this.viewer.scriptStatus (this.eval.getNextStatement ());
return true;
}return false;
}, $fz.isPrivate = true, $fz), "~S");
Clazz.overrideMethod (c$, "evalStringQuietSync", 
function (strScript, isQuiet, allowSyncScript) {
if (allowSyncScript && this.viewer.statusManager.syncingScripts && strScript.indexOf ("#NOSYNC;") < 0) this.viewer.syncScript (strScript + " #NOSYNC;", null, 0);
if (this.eval.isPaused () && strScript.charAt (0) != '!') strScript = '!' + J.util.TextFormat.trim (strScript, "\n\r\t ");
var isInsert = (strScript.length > 0 && strScript.charAt (0) == '!');
if (isInsert) strScript = strScript.substring (1);
var msg = this.checkScriptExecution (strScript, isInsert);
if (msg != null) return msg;
if (this.viewer.isScriptExecuting () && (isInsert || this.eval.isPaused ())) {
this.viewer.insertedCommand = strScript;
if (strScript.indexOf ("moveto ") == 0) this.flushQueue ("moveto ");
return "!" + strScript;
}this.viewer.insertedCommand = "";
if (isQuiet) strScript += "\u0001## EDITOR_IGNORE ##";
return this.addScript (strScript, false, isQuiet && !this.viewer.getBoolean (603979879));
}, "~S,~B,~B");
Clazz.overrideMethod (c$, "checkHalt", 
function (str, isInsert) {
if (str.equalsIgnoreCase ("pause")) {
this.viewer.pauseScriptExecution ();
if (this.viewer.scriptEditorVisible) this.viewer.setScriptStatus ("", "paused -- type RESUME to continue", 0, null);
return true;
}if (str.equalsIgnoreCase ("menu")) {
this.viewer.getProperty ("DATA_API", "getPopupMenu", "\0");
return true;
}str = str.toLowerCase ();
var exitScript = false;
var haltType = null;
if (str.startsWith ("exit")) {
this.viewer.haltScriptExecution ();
this.viewer.clearScriptQueue ();
this.viewer.clearTimeouts ();
exitScript = str.equals (haltType = "exit");
} else if (str.startsWith ("quit")) {
this.viewer.haltScriptExecution ();
exitScript = str.equals (haltType = "quit");
}if (haltType == null) return false;
if (isInsert) {
this.viewer.clearThreads ();
this.viewer.queueOnHold = false;
}if (isInsert || this.viewer.global.waitForMoveTo) {
this.viewer.stopMotion ();
}J.util.Logger.info (this.viewer.isSyntaxCheck ? haltType + " -- stops script checking" : (isInsert ? "!" : "") + haltType + " received");
this.viewer.isSyntaxCheck = false;
return exitScript;
}, "~S,~B");
Clazz.overrideMethod (c$, "getAtomBitSetEval", 
function (eval, atomExpression) {
if (eval == null) {
eval = this.evalTemp;
if (eval == null) eval = this.evalTemp = this.newScriptEvaluator ();
}return eval.getAtomBitSet (atomExpression);
}, "J.api.JmolScriptEvaluator,~O");
Clazz.overrideMethod (c$, "scriptCheckRet", 
function (strScript, returnContext) {
if (strScript.indexOf (")") == 0 || strScript.indexOf ("!") == 0) strScript = strScript.substring (1);
var sc = this.newScriptEvaluator ().checkScriptSilent (strScript);
if (returnContext || sc.errorMessage == null) return sc;
return sc.errorMessage;
}, "~S,~B");
});
// 
//// J\api\JmolScriptManager.js 
// 
Clazz.declarePackage ("J.api");
Clazz.declareInterface (J.api, "JmolScriptManager");
// 
//// J\thread\CommandWatcherThread.js 
// 
Clazz.declarePackage ("J.thread");
Clazz.load (["J.thread.JmolThread"], "J.thread.CommandWatcherThread", ["java.lang.Thread", "J.util.Logger"], function () {
c$ = Clazz.decorateAsClass (function () {
this.scriptManager = null;
Clazz.instantialize (this, arguments);
}, J.thread, "CommandWatcherThread", J.thread.JmolThread);
Clazz.makeConstructor (c$, 
function (viewer, scriptManager) {
Clazz.superConstructor (this, J.thread.CommandWatcherThread);
this.setViewer (viewer, "CommmandWatcherThread");
this.scriptManager = scriptManager;
}, "J.viewer.Viewer,J.viewer.ScriptManager");
Clazz.overrideMethod (c$, "run", 
function () {
Thread.currentThread ().setPriority (1);
while (!this.stopped) {
try {
Thread.sleep (50);
if (!this.stopped) {
this.scriptManager.runScriptNow ();
}} catch (e$$) {
if (Clazz.exceptionOf (e$$, InterruptedException)) {
var ie = e$$;
{
J.util.Logger.warn ("CommandWatcher InterruptedException! " + this);
break;
}
} else if (Clazz.exceptionOf (e$$, Exception)) {
var ie = e$$;
{
var s = "script processing ERROR:\n\n" + ie.toString ();
for (var i = 0; i < ie.getStackTrace ().length; i++) {
s += "\n" + ie.getStackTrace ()[i].toString ();
}
J.util.Logger.warn ("CommandWatcher Exception! " + s);
break;
}
} else {
throw e$$;
}
}
}
});
Clazz.overrideMethod (c$, "run1", 
function (mode) {
}, "~N");
Clazz.defineStatics (c$,
"commandDelay", 50);
});
// 
//// J\thread\ScriptQueueThread.js 
// 
Clazz.declarePackage ("J.thread");
Clazz.load (["J.thread.JmolThread"], "J.thread.ScriptQueueThread", ["J.util.Logger"], function () {
c$ = Clazz.decorateAsClass (function () {
this.scriptManager = null;
this.startedByCommandThread = false;
this.pt = 0;
Clazz.instantialize (this, arguments);
}, J.thread, "ScriptQueueThread", J.thread.JmolThread);
Clazz.makeConstructor (c$, 
function (scriptManager, viewer, startedByCommandThread, pt) {
Clazz.superConstructor (this, J.thread.ScriptQueueThread);
this.setViewer (viewer, "QueueThread" + pt);
this.scriptManager = scriptManager;
this.viewer = viewer;
this.startedByCommandThread = startedByCommandThread;
this.pt = pt;
}, "J.api.JmolScriptManager,J.viewer.Viewer,~B,~N");
Clazz.overrideMethod (c$, "run1", 
function (mode) {
while (true) switch (mode) {
case -1:
mode = 0;
break;
case 0:
if (this.stopped || this.scriptManager.getScriptQueue ().size () == 0) {
mode = -2;
break;
}if (!this.runNextScript () && !this.runSleep (100, 0)) return;
break;
case -2:
this.scriptManager.queueThreadFinished (this.pt);
return;
}

}, "~N");
$_M(c$, "runNextScript", 
($fz = function () {
var queue = this.scriptManager.getScriptQueue ();
if (queue.size () == 0) return false;
var scriptItem = this.scriptManager.getScriptItem (false, this.startedByCommandThread);
if (scriptItem == null) return false;
var script = scriptItem.get (0);
var statusList = scriptItem.get (1);
var returnType = scriptItem.get (2);
var isScriptFile = (scriptItem.get (3)).booleanValue ();
var isQuiet = (scriptItem.get (4)).booleanValue ();
if (J.util.Logger.debugging) {
J.util.Logger.info ("Queue[" + this.pt + "][" + queue.size () + "] scripts; running: " + script);
}queue.remove (0);
this.viewer.evalStringWaitStatusQueued (returnType, script, statusList, isScriptFile, isQuiet, true);
if (queue.size () == 0) {
return false;
}return true;
}, $fz.isPrivate = true, $fz));
});
// 
//// J\script\ScriptEvaluator.js 
// 
Clazz.declarePackage ("J.script");
Clazz.load (["J.api.JmolScriptEvaluator"], "J.script.ScriptEvaluator", ["java.lang.Boolean", "$.Float", "$.NullPointerException", "$.Short", "$.Thread", "java.util.Hashtable", "J.atomdata.RadiusData", "J.constant.EnumAnimationMode", "$.EnumAxesMode", "$.EnumPalette", "$.EnumStereoMode", "$.EnumStructure", "$.EnumVdw", "J.i18n.GT", "J.io.JmolBinary", "J.modelset.Atom", "$.AtomCollection", "$.Bond", "$.Group", "$.LabelToken", "$.MeasurementData", "$.ModelCollection", "$.TickInfo", "J.script.SV", "$.ScriptCompiler", "$.ScriptContext", "$.ScriptException", "$.ScriptInterruption", "$.ScriptMathProcessor", "$.T", "J.shape.Object2d", "J.util.ArrayUtil", "$.BS", "$.BSUtil", "$.BoxInfo", "$.C", "$.ColorEncoder", "$.ColorUtil", "$.Elements", "$.Escape", "$.GData", "$.JmolEdge", "$.JmolList", "$.Logger", "$.Matrix3f", "$.Matrix4f", "$.Measure", "$.MeshSurface", "$.P3", "$.P4", "$.Parser", "$.Point3fi", "$.Quaternion", "$.SB", "$.TextFormat", "$.V3", "J.viewer.ActionManager", "$.FileManager", "$.JC", "$.StateManager", "$.Viewer"], function () {
c$ = Clazz.decorateAsClass (function () {
this.allowJSThreads = true;
this.listCommands = false;
this.isJS = false;
this.tQuiet = false;
this.chk = false;
this.isCmdLine_C_Option = false;
this.isCmdLine_c_or_C_Option = false;
this.historyDisabled = false;
this.logMessages = false;
this.debugScript = false;
this.executionStopped = false;
this.executionPaused = false;
this.executionStepping = false;
this.executing = false;
this.timeBeginExecution = 0;
this.timeEndExecution = 0;
this.mustResumeEval = false;
this.sm = null;
this.currentThread = null;
this.viewer = null;
this.compiler = null;
this.definedAtomSets = null;
this.outputBuffer = null;
this.contextPath = "";
this.scriptFileName = null;
this.functionName = null;
this.isStateScript = false;
this.scriptLevel = 0;
this.scriptReportingLevel = 0;
this.commandHistoryLevelMax = 0;
this.aatoken = null;
this.lineNumbers = null;
this.lineIndices = null;
this.contextVariables = null;
this.$script = null;
this.pc = 0;
this.thisCommand = null;
this.fullCommand = null;
this.st = null;
this.slen = 0;
this.iToken = 0;
this.lineEnd = 0;
this.pcEnd = 0;
this.scriptExtensions = null;
this.forceNoAddHydrogens = false;
this.parallelProcessor = null;
this.thisContext = null;
this.$error = false;
this.errorMessage = null;
this.errorMessageUntranslated = null;
this.errorType = null;
this.iCommandError = 0;
this.ignoreError = false;
this.tempStatement = null;
this.isBondSet = false;
this.expressionResult = null;
this.theTok = 0;
this.theToken = null;
this.coordinatesAreFractional = false;
this.fractionalPoint = null;
this.$data = null;
Clazz.instantialize (this, arguments);
}, J.script, "ScriptEvaluator", null, J.api.JmolScriptEvaluator);
Clazz.overrideMethod (c$, "getAllowJSThreads", 
function () {
return this.allowJSThreads;
});
Clazz.overrideMethod (c$, "setViewer", 
function (viewer) {
this.viewer = viewer;
this.compiler = (this.compiler == null ? viewer.compiler : this.compiler);
this.isJS = viewer.isSingleThreaded;
this.definedAtomSets = viewer.definedAtomSets;
return this;
}, "J.viewer.Viewer");
Clazz.makeConstructor (c$, 
function () {
this.currentThread = Thread.currentThread ();
});
Clazz.overrideMethod (c$, "setCompiler", 
function () {
this.viewer.compiler = this.compiler =  new J.script.ScriptCompiler (this.viewer);
});
Clazz.overrideMethod (c$, "compileScriptString", 
function (script, tQuiet) {
this.clearState (tQuiet);
this.contextPath = "[script]";
return this.compileScript (null, script, this.debugScript);
}, "~S,~B");
Clazz.overrideMethod (c$, "compileScriptFile", 
function (filename, tQuiet) {
this.clearState (tQuiet);
this.contextPath = filename;
return this.compileScriptFileInternal (filename, null, null, null);
}, "~S,~B");
Clazz.overrideMethod (c$, "evaluateCompiledScript", 
function (isCmdLine_c_or_C_Option, isCmdLine_C_Option, historyDisabled, listCommands, outputBuffer, allowThreads) {
var tempOpen = this.isCmdLine_C_Option;
this.isCmdLine_C_Option = isCmdLine_C_Option;
this.executionStopped = this.executionPaused = false;
this.executionStepping = false;
this.executing = true;
this.chk = this.isCmdLine_c_or_C_Option = isCmdLine_c_or_C_Option;
this.timeBeginExecution = System.currentTimeMillis ();
this.historyDisabled = historyDisabled;
this.outputBuffer = outputBuffer;
this.currentThread = Thread.currentThread ();
this.allowJSThreads = allowThreads;
this.listCommands = listCommands;
this.startEval ();
this.isCmdLine_C_Option = tempOpen;
this.viewer.setStateScriptVersion (null);
}, "~B,~B,~B,~B,J.util.SB,~B");
$_M(c$, "createFunction", 
($fz = function (fname, xyz, ret) {
var e = ( new J.script.ScriptEvaluator ());
e.setViewer (this.viewer);
try {
e.compileScript (null, "function " + fname + "(" + xyz + ") { return " + ret + "}", false);
var params =  new J.util.JmolList ();
for (var i = 0; i < xyz.length; i += 2) params.addLast (J.script.SV.newVariable (3, Float.$valueOf (0)).setName (xyz.substring (i, i + 1)));

return [e.aatoken[0][1].value, params];
} catch (ex) {
if (Clazz.exceptionOf (ex, Exception)) {
return null;
} else {
throw ex;
}
}
}, $fz.isPrivate = true, $fz), "~S,~S,~S");
$_M(c$, "useThreads", 
($fz = function () {
return (!this.viewer.autoExit && this.viewer.haveDisplay && this.outputBuffer == null);
}, $fz.isPrivate = true, $fz));
$_M(c$, "startEval", 
($fz = function () {
this.viewer.pushHoldRepaintWhy ("runEval");
this.setScriptExtensions ();
this.executeCommands (false);
}, $fz.isPrivate = true, $fz));
$_M(c$, "executeCommands", 
($fz = function (isTry) {
var haveError = false;
try {
if (!this.dispatchCommands (false, false)) return;
} catch (e$$) {
if (Clazz.exceptionOf (e$$, Error)) {
var er = e$$;
{
this.viewer.handleError (er, false);
this.setErrorMessage ("" + er + " " + this.viewer.getShapeErrorState ());
this.errorMessageUntranslated = "" + er;
this.scriptStatusOrBuffer (this.errorMessage);
haveError = true;
}
} else if (Clazz.exceptionOf (e$$, J.script.ScriptException)) {
var e = e$$;
{
if (Clazz.instanceOf (e, J.script.ScriptInterruption)) {
return;
}if (isTry) {
this.viewer.setStringProperty ("_errormessage", "" + e);
return;
}this.setErrorMessage (e.toString ());
this.errorMessageUntranslated = e.getErrorMessageUntranslated ();
this.scriptStatusOrBuffer (this.errorMessage);
this.viewer.notifyError ((this.errorMessage != null && this.errorMessage.indexOf ("java.lang.OutOfMemoryError") >= 0 ? "Error" : "ScriptException"), this.errorMessage, this.errorMessageUntranslated);
haveError = true;
}
} else {
throw e$$;
}
}
if (haveError || !this.isJS || !this.allowJSThreads) {
this.viewer.setTainted (true);
this.viewer.popHoldRepaintWhy ("runEval");
}this.timeEndExecution = System.currentTimeMillis ();
if (this.errorMessage == null && this.executionStopped) this.setErrorMessage ("execution interrupted");
 else if (!this.tQuiet && !this.chk) this.viewer.scriptStatus ("Script completed");
this.executing = this.chk = this.isCmdLine_c_or_C_Option = this.historyDisabled = false;
var msg = this.getErrorMessageUntranslated ();
this.viewer.setErrorMessage (this.errorMessage, msg);
if (!this.tQuiet) this.viewer.setScriptStatus ("Jmol script terminated", this.errorMessage, 1 + this.getExecutionWalltime (), msg);
}, $fz.isPrivate = true, $fz), "~B");
Clazz.overrideMethod (c$, "resumeEval", 
function (sc) {
this.setErrorMessage (null);
if (this.executionStopped || sc == null || !sc.mustResumeEval) {
this.viewer.setTainted (true);
this.viewer.popHoldRepaintWhy ("runEval");
this.viewer.queueOnHold = false;
return;
}if (!this.executionPaused) sc.pc++;
this.thisContext = sc;
if (sc.scriptLevel > 0) this.scriptLevel = sc.scriptLevel - 1;
this.restoreScriptContext (sc, true, false, false);
this.executeCommands (sc.isTryCatch);
}, "J.script.ScriptContext");
Clazz.overrideMethod (c$, "runScriptBuffer", 
function (script, outputBuffer) {
this.pushContext (null);
this.contextPath += " >> script() ";
this.outputBuffer = outputBuffer;
this.allowJSThreads = false;
if (this.compileScript (null, script + "\u0001## EDITOR_IGNORE ##", false)) this.dispatchCommands (false, false);
this.popContext (false, false);
}, "~S,J.util.SB");
Clazz.overrideMethod (c$, "checkScriptSilent", 
function (script) {
var sc = this.compiler.compile (null, script, false, true, false, true);
if (sc.errorType != null) return sc;
this.restoreScriptContext (sc, false, false, false);
this.chk = true;
this.isCmdLine_c_or_C_Option = this.isCmdLine_C_Option = false;
this.pc = 0;
try {
this.dispatchCommands (false, false);
} catch (e) {
if (Clazz.exceptionOf (e, J.script.ScriptException)) {
this.setErrorMessage (e.toString ());
sc = this.getScriptContext ();
} else {
throw e;
}
}
this.chk = false;
return sc;
}, "~S");
c$.getContextTrace = $_M(c$, "getContextTrace", 
function (sc, sb, isTop) {
if (sb == null) sb =  new J.util.SB ();
sb.append (J.script.ScriptEvaluator.setErrorLineMessage (sc.functionName, sc.scriptFileName, sc.lineNumbers[sc.pc], sc.pc, J.script.ScriptEvaluator.statementAsString (sc.statement, (isTop ? sc.iToken : 9999), false)));
if (sc.parentContext != null) J.script.ScriptEvaluator.getContextTrace (sc.parentContext, sb, false);
return sb;
}, "J.script.ScriptContext,J.util.SB,~B");
Clazz.overrideMethod (c$, "setDebugging", 
function () {
this.debugScript = this.viewer.getBoolean (603979824);
this.logMessages = (this.debugScript && J.util.Logger.debugging);
});
$_M(c$, "getExecutionWalltime", 
($fz = function () {
return (this.timeEndExecution - this.timeBeginExecution);
}, $fz.isPrivate = true, $fz));
Clazz.overrideMethod (c$, "haltExecution", 
function () {
this.resumePausedExecution ();
this.executionStopped = true;
});
Clazz.overrideMethod (c$, "pauseExecution", 
function (withDelay) {
if (this.chk || this.viewer.isHeadless ()) return;
if (withDelay && !this.isJS) this.viewer.delayScript (this, -100);
this.viewer.popHoldRepaintWhy ("pauseExecution");
this.executionStepping = false;
this.executionPaused = true;
}, "~B");
Clazz.overrideMethod (c$, "stepPausedExecution", 
function () {
this.executionStepping = true;
this.executionPaused = false;
});
Clazz.overrideMethod (c$, "resumePausedExecution", 
function () {
this.executionPaused = false;
this.executionStepping = false;
});
Clazz.overrideMethod (c$, "isExecuting", 
function () {
return this.executing && !this.executionStopped;
});
Clazz.overrideMethod (c$, "isPaused", 
function () {
return this.executionPaused;
});
Clazz.overrideMethod (c$, "isStepping", 
function () {
return this.executionStepping;
});
Clazz.overrideMethod (c$, "isStopped", 
function () {
return this.executionStopped || !this.isJS && this.currentThread !== Thread.currentThread ();
});
Clazz.overrideMethod (c$, "getNextStatement", 
function () {
return (this.pc < this.aatoken.length ? J.script.ScriptEvaluator.setErrorLineMessage (this.functionName, this.scriptFileName, this.getLinenumber (null), this.pc, J.script.ScriptEvaluator.statementAsString (this.aatoken[this.pc], -9999, this.logMessages)) : "");
});
$_M(c$, "getCommand", 
($fz = function (pc, allThisLine, addSemi) {
if (pc >= this.lineIndices.length) return "";
if (allThisLine) {
var pt0 = -1;
var pt1 = this.$script.length;
for (var i = 0; i < this.lineNumbers.length; i++) if (this.lineNumbers[i] == this.lineNumbers[pc]) {
if (pt0 < 0) pt0 = this.lineIndices[i][0];
pt1 = this.lineIndices[i][1];
} else if (this.lineNumbers[i] == 0 || this.lineNumbers[i] > this.lineNumbers[pc]) {
break;
}
if (pt1 == this.$script.length - 1 && this.$script.endsWith ("}")) pt1++;
return (pt0 == this.$script.length || pt1 < pt0 ? "" : this.$script.substring (Math.max (pt0, 0), Math.min (this.$script.length, pt1)));
}var ichBegin = this.lineIndices[pc][0];
var ichEnd = this.lineIndices[pc][1];
var s = "";
if (ichBegin < 0 || ichEnd <= ichBegin || ichEnd > this.$script.length) return "";
try {
s = this.$script.substring (ichBegin, ichEnd);
if (s.indexOf ("\\\n") >= 0) s = J.util.TextFormat.simpleReplace (s, "\\\n", "  ");
if (s.indexOf ("\\\r") >= 0) s = J.util.TextFormat.simpleReplace (s, "\\\r", "  ");
if (s.length > 0 && !s.endsWith (";")) s += ";";
} catch (e) {
if (Clazz.exceptionOf (e, Exception)) {
J.util.Logger.error ("darn problem in Eval getCommand: ichBegin=" + ichBegin + " ichEnd=" + ichEnd + " len = " + this.$script.length + "\n" + e);
} else {
throw e;
}
}
return s;
}, $fz.isPrivate = true, $fz), "~N,~B,~B");
$_M(c$, "logDebugScript", 
($fz = function (ifLevel) {
if (this.logMessages) {
if (this.st.length > 0) J.util.Logger.debug (this.st[0].toString ());
for (var i = 1; i < this.slen; ++i) J.util.Logger.debug (this.st[i].toString ());

}this.iToken = -9999;
if (this.logMessages) {
var strbufLog =  new J.util.SB ();
var s = (ifLevel > 0 ? "                          ".substring (0, ifLevel * 2) : "");
strbufLog.append (s).append (J.script.ScriptEvaluator.statementAsString (this.st, this.iToken, this.logMessages));
this.viewer.scriptStatus (strbufLog.toString ());
} else {
var cmd = this.getCommand (this.pc, false, false);
if (cmd !== "") this.viewer.scriptStatus (cmd);
}}, $fz.isPrivate = true, $fz), "~N");
Clazz.overrideMethod (c$, "evaluateExpression", 
function (expr, asVariable) {
var e = ( new J.script.ScriptEvaluator ()).setViewer (this.viewer);
try {
e.pushContext (null);
e.allowJSThreads = false;
} catch (e1) {
if (Clazz.exceptionOf (e1, J.script.ScriptException)) {
} else {
throw e1;
}
}
return (e.evaluate (expr, asVariable));
}, "~O,~B");
$_M(c$, "evaluate", 
($fz = function (expr, asVariable) {
try {
if (Clazz.instanceOf (expr, String)) {
if (this.compileScript (null, "e_x_p_r_e_s_s_i_o_n" + " = " + expr, false)) {
this.contextVariables = this.viewer.getContextVariables ();
this.setStatement (0);
return (asVariable ? this.parameterExpressionList (2, -1, false).get (0) : this.parameterExpressionString (2, 0));
}} else if (Clazz.instanceOf (expr, Array)) {
this.contextVariables = this.viewer.getContextVariables ();
var bs = this.atomExpression (expr, 0, 0, true, false, true, false);
return (asVariable ? J.script.SV.newScriptVariableBs (bs, -1) : bs);
}} catch (ex) {
if (Clazz.exceptionOf (ex, Exception)) {
J.util.Logger.error ("Error evaluating: " + expr + "\n" + ex);
} else {
throw ex;
}
}
return (asVariable ? J.script.SV.getVariable ("ERROR") : "ERROR");
}, $fz.isPrivate = true, $fz), "~O,~B");
Clazz.overrideMethod (c$, "evaluateParallel", 
function (context, shapeManager) {
var e =  new J.script.ScriptEvaluator ();
e.setViewer (this.viewer);
e.historyDisabled = true;
e.compiler =  new J.script.ScriptCompiler (this.viewer);
e.sm = shapeManager;
try {
e.restoreScriptContext (context, true, false, false);
e.allowJSThreads = false;
e.dispatchCommands (false, false);
} catch (ex) {
if (Clazz.exceptionOf (ex, Exception)) {
this.viewer.setStringProperty ("_errormessage", "" + ex);
if (e.thisContext == null) {
J.util.Logger.error ("Error evaluating context");
ex.printStackTrace ();
}return false;
} else {
throw ex;
}
}
return true;
}, "J.script.ScriptContext,J.viewer.ShapeManager");
Clazz.overrideMethod (c$, "getAtomBitSet", 
function (atomExpression) {
if (Clazz.instanceOf (atomExpression, J.util.BS)) return atomExpression;
var bs =  new J.util.BS ();
try {
this.pushContext (null);
var scr = "select (" + atomExpression + ")";
scr = J.util.TextFormat.replaceAllCharacters (scr, "\n\r", "),(");
scr = J.util.TextFormat.simpleReplace (scr, "()", "(none)");
if (this.compileScript (null, scr, false)) {
this.st = this.aatoken[0];
bs = this.atomExpression (this.st, 1, 0, false, false, true, true);
}this.popContext (false, false);
} catch (ex) {
if (Clazz.exceptionOf (ex, Exception)) {
J.util.Logger.error ("getAtomBitSet " + atomExpression + "\n" + ex);
} else {
throw ex;
}
}
return bs;
}, "~O");
Clazz.overrideMethod (c$, "getAtomBitSetVector", 
function (atomCount, atomExpression) {
var V =  new J.util.JmolList ();
var bs = this.getAtomBitSet (atomExpression);
for (var i = bs.nextSetBit (0); i >= 0; i = bs.nextSetBit (i + 1)) {
V.addLast (Integer.$valueOf (i));
}
return V;
}, "~N,~O");
$_M(c$, "parameterExpressionList", 
($fz = function (pt, ptAtom, isArrayItem) {
return this.parameterExpression (pt, -1, null, true, true, ptAtom, isArrayItem, null, null);
}, $fz.isPrivate = true, $fz), "~N,~N,~B");
$_M(c$, "parameterExpressionString", 
($fz = function (pt, ptMax) {
return this.parameterExpression (pt, ptMax, "", true, false, -1, false, null, null);
}, $fz.isPrivate = true, $fz), "~N,~N");
$_M(c$, "parameterExpressionBoolean", 
($fz = function (pt, ptMax) {
return (this.parameterExpression (pt, ptMax, null, true, false, -1, false, null, null)).booleanValue ();
}, $fz.isPrivate = true, $fz), "~N,~N");
$_M(c$, "parameterExpressionToken", 
($fz = function (pt) {
var result = this.parameterExpressionList (pt, -1, false);
return (result.size () > 0 ? result.get (0) : J.script.SV.newVariable (4, ""));
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "parameterExpression", 
($fz = function (pt, ptMax, key, ignoreComma, asVector, ptAtom, isArrayItem, localVars, localVar) {
var v;
var res;
var isImplicitAtomProperty = (localVar != null);
var isOneExpressionOnly = (pt < 0);
var returnBoolean = (!asVector && key == null);
var returnString = (!asVector && key != null && key.length == 0);
var nSquare = 0;
if (isOneExpressionOnly) pt = -pt;
var nParen = 0;
var rpn =  new J.script.ScriptMathProcessor (this, isArrayItem, asVector, false);
if (pt == 0 && ptMax == 0) pt = 2;
if (ptMax < pt) ptMax = this.slen;
out : for (var i = pt; i < ptMax; i++) {
v = null;
var tok = this.getToken (i).tok;
if (isImplicitAtomProperty && this.tokAt (i + 1) != 1048584) {
var token = (localVars != null && localVars.containsKey (this.theToken.value) ? null : this.getBitsetPropertySelector (i, false));
if (token != null) {
rpn.addXVar (localVars.get (localVar));
if (!rpn.addOpAllowMath (token, (this.tokAt (i + 1) == 269484048))) this.error (22);
if ((token.intValue == 135368713 || token.intValue == 102436) && this.tokAt (this.iToken + 1) != 269484048) {
rpn.addOp (J.script.T.tokenLeftParen);
rpn.addOp (J.script.T.tokenRightParen);
}i = this.iToken;
continue;
}}switch (tok) {
case 1060866:
if (this.tokAt (++i) == 1048577) {
v = this.parameterExpressionToken (++i);
i = this.iToken;
} else if (this.tokAt (i) == 2) {
v = this.viewer.getAtomBits (1095763969, Integer.$valueOf (this.st[i].intValue));
break;
} else {
v = this.getParameter (J.script.SV.sValue (this.st[i]), 1073742190);
}v = this.getParameter ((v).asString (), 1073742190);
break;
case 135369225:
if (this.getToken (++i).tok != 269484048) this.error (22);
if (localVars == null) localVars =  new java.util.Hashtable ();
res = this.parameterExpression (++i, -1, null, ignoreComma, false, -1, false, localVars, localVar);
var TF = (res).booleanValue ();
var iT = this.iToken;
if (this.getToken (iT++).tok != 1048591) this.error (22);
this.parameterExpressionBoolean (iT, -1);
var iF = this.iToken;
if (this.tokAt (iF++) != 1048591) this.error (22);
this.parameterExpression (-iF, -1, null, ignoreComma, false, 1, false, localVars, localVar);
var iEnd = this.iToken;
if (this.tokAt (iEnd) != 269484049) this.error (22);
v = this.parameterExpression (TF ? iT : iF, TF ? iF : iEnd, "XXX", ignoreComma, false, 1, false, localVars, localVar);
i = iEnd;
break;
case 135369224:
case 135280132:
var isFunctionOfX = (pt > 0);
var isFor = (isFunctionOfX && tok == 135369224);
var dummy;
if (isFunctionOfX) {
if (this.getToken (++i).tok != 269484048 || !J.script.T.tokAttr (this.getToken (++i).tok, 1073741824)) this.error (22);
dummy = this.parameterAsString (i);
if (this.getToken (++i).tok != 1048591) this.error (22);
} else {
dummy = "_x";
}v = this.parameterExpressionToken (-(++i)).value;
if (!(Clazz.instanceOf (v, J.util.BS))) this.error (22);
var bsAtoms = v;
i = this.iToken;
if (isFunctionOfX && this.getToken (i++).tok != 1048591) this.error (22);
var bsSelect =  new J.util.BS ();
var bsX =  new J.util.BS ();
var sout = (isFor ?  new Array (J.util.BSUtil.cardinalityOf (bsAtoms)) : null);
if (localVars == null) localVars =  new java.util.Hashtable ();
bsX.set (0);
var t = J.script.SV.newScriptVariableBs (bsX, 0);
localVars.put (dummy, t.setName (dummy));
var pt2 = -1;
if (isFunctionOfX) {
pt2 = i - 1;
var np = 0;
var tok2;
while (np >= 0 && ++pt2 < ptMax) {
if ((tok2 = this.tokAt (pt2)) == 269484049) np--;
 else if (tok2 == 269484048) np++;
}
}var p = 0;
var jlast = 0;
var j = bsAtoms.nextSetBit (0);
if (j < 0) {
this.iToken = pt2 - 1;
} else if (!this.chk) {
for (; j >= 0; j = bsAtoms.nextSetBit (j + 1)) {
if (jlast >= 0) bsX.clear (jlast);
jlast = j;
bsX.set (j);
t.index = j;
res = this.parameterExpression (i, pt2, (isFor ? "XXX" : null), ignoreComma, isFor, j, false, localVars, isFunctionOfX ? null : dummy);
if (isFor) {
if (res == null || (res).size () == 0) this.error (22);
sout[p++] = ((res).get (0)).asString ();
} else if ((res).booleanValue ()) {
bsSelect.set (j);
}}
}if (isFor) {
v = sout;
} else if (isFunctionOfX) {
v = bsSelect;
} else {
return this.bitsetVariableVector (bsSelect);
}i = this.iToken + 1;
break;
case 1048591:
break out;
case 3:
rpn.addXNum (J.script.SV.newVariable (3, this.theToken.value));
break;
case 1048614:
case 2:
rpn.addXNum (J.script.SV.newScriptVariableInt (this.theToken.intValue));
break;
case 135266319:
if (this.tokAt (this.iToken + 1) == 269484048) {
if (!rpn.addOpAllowMath (this.theToken, true)) this.error (22);
break;
}rpn.addXVar (J.script.SV.newScriptVariableToken (this.theToken));
break;
case 1087375362:
case 1087375361:
case 1048580:
case 1679429641:
case 1087373316:
case 1048582:
case 1087375365:
case 1087373318:
case 1095766028:
case 1095761934:
case 1087373320:
case 1095761938:
case 135267335:
case 135267336:
case 1238369286:
case 1641025539:
case 1048589:
case 1048588:
case 4:
case 8:
case 9:
case 11:
case 12:
case 10:
case 6:
rpn.addXVar (J.script.SV.newScriptVariableToken (this.theToken));
break;
case 1048583:
this.ignoreError = true;
var ptc;
try {
ptc = this.centerParameter (i);
rpn.addXVar (J.script.SV.newVariable (8, ptc));
} catch (e) {
if (Clazz.exceptionOf (e, Exception)) {
rpn.addXStr ("");
} else {
throw e;
}
}
this.ignoreError = false;
i = this.iToken;
break;
case 1048586:
if (this.tokAt (i + 1) == 4) v = this.getHash (i);
 else v = this.getPointOrPlane (i, false, true, true, false, 3, 4);
i = this.iToken;
break;
case 1048577:
if (this.tokAt (i + 1) == 1048578) {
v =  new java.util.Hashtable ();
i++;
break;
} else if (this.tokAt (i + 1) == 1048579 && this.tokAt (i + 2) == 1048578) {
tok = 1048579;
this.iToken += 2;
}case 1048579:
if (tok == 1048579) v = this.viewer.getModelUndeletedAtomsBitSet (-1);
 else v = this.atomExpression (this.st, i, 0, true, true, true, true);
i = this.iToken;
if (nParen == 0 && isOneExpressionOnly) {
this.iToken++;
return this.bitsetVariableVector (v);
}break;
case 1073742195:
rpn.addOp (this.theToken);
continue;
case 1048578:
i++;
break out;
case 1048590:
if (!ignoreComma && nParen == 0 && nSquare == 0) break out;
this.error (22);
break;
case 269484080:
if (!ignoreComma && nParen == 0 && nSquare == 0) {
break out;
}if (!rpn.addOp (this.theToken)) this.error (22);
break;
case 1048584:
var token = this.getBitsetPropertySelector (i + 1, false);
if (token == null) this.error (22);
var isUserFunction = (token.intValue == 135368713);
var allowMathFunc = true;
var tok2 = this.tokAt (this.iToken + 2);
if (this.tokAt (this.iToken + 1) == 1048584) {
switch (tok2) {
case 1048579:
tok2 = 480;
if (this.tokAt (this.iToken + 3) == 1048584 && this.tokAt (this.iToken + 4) == 1276118529) tok2 = 224;
case 32:
case 64:
case 192:
case 128:
case 160:
case 96:
allowMathFunc = (isUserFunction || tok2 == 480 || tok2 == 224);
token.intValue |= tok2;
this.getToken (this.iToken + 2);
}
}allowMathFunc = new Boolean (allowMathFunc & (this.tokAt (this.iToken + 1) == 269484048 || isUserFunction)).valueOf ();
if (!rpn.addOpAllowMath (token, allowMathFunc)) this.error (22);
i = this.iToken;
if (token.intValue == 135368713 && this.tokAt (i + 1) != 269484048) {
rpn.addOp (J.script.T.tokenLeftParen);
rpn.addOp (J.script.T.tokenRightParen);
}break;
default:
if (J.script.T.tokAttr (this.theTok, 269484032) || J.script.T.tokAttr (this.theTok, 135266304) && this.tokAt (this.iToken + 1) == 269484048) {
if (!rpn.addOp (this.theToken)) {
if (ptAtom >= 0) {
break out;
}this.error (22);
}switch (this.theTok) {
case 269484048:
nParen++;
break;
case 269484049:
if (--nParen <= 0 && nSquare == 0 && isOneExpressionOnly) {
this.iToken++;
break out;
}break;
case 269484096:
nSquare++;
break;
case 269484097:
if (--nSquare == 0 && nParen == 0 && isOneExpressionOnly) {
this.iToken++;
break out;
}break;
}
} else {
var name = this.parameterAsString (i).toLowerCase ();
var haveParens = (this.tokAt (i + 1) == 269484048);
if (this.chk) {
v = name;
} else if (!haveParens && (localVars == null || (v = localVars.get (name)) == null)) {
v = this.getContextVariableAsVariable (name);
}if (v == null) {
if (J.script.T.tokAttr (this.theTok, 1073741824) && this.viewer.isFunction (name)) {
if (!rpn.addOp (J.script.SV.newVariable (135368713, this.theToken.value))) this.error (22);
if (!haveParens) {
rpn.addOp (J.script.T.tokenLeftParen);
rpn.addOp (J.script.T.tokenRightParen);
}} else {
rpn.addXVar (this.viewer.getOrSetNewVariable (name, false));
}}}}
if (v != null) {
if (Clazz.instanceOf (v, J.util.BS)) rpn.addXBs (v);
 else rpn.addXObj (v);
}}
var result = rpn.getResult (false);
if (result == null) {
if (!this.chk) rpn.dumpStacks ("null result");
this.error (13);
}if (result.tok == 135198) return result.value;
if (returnBoolean) return Boolean.$valueOf (result.asBoolean ());
if (returnString) {
if (result.tok == 4) result.intValue = 2147483647;
return result.asString ();
}switch (result.tok) {
case 1048589:
case 1048588:
return Boolean.$valueOf (result.intValue == 1);
case 2:
return Integer.$valueOf (result.intValue);
case 10:
case 3:
case 4:
case 8:
default:
return result.value;
}
}, $fz.isPrivate = true, $fz), "~N,~N,~S,~B,~B,~N,~B,java.util.Map,~S");
$_M(c$, "getHash", 
($fz = function (i) {
var ht =  new java.util.Hashtable ();
for (i = i + 1; i < this.slen; i++) {
if (this.tokAt (i) == 1048590) break;
var key = this.stringParameter (i++);
if (this.tokAt (i++) != 269484066) this.error (22);
var v = this.parameterExpression (i, 0, null, false, true, -1, false, null, null);
ht.put (key, v.get (0));
i = this.iToken;
if (this.tokAt (i) != 269484080) break;
}
this.iToken = i;
if (this.tokAt (i) != 1048590) this.error (22);
return ht;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "bitsetVariableVector", 
function (v) {
var resx =  new J.util.JmolList ();
if (Clazz.instanceOf (v, J.util.BS)) {
resx.addLast (J.script.SV.newVariable (10, v));
}return resx;
}, "~O");
$_M(c$, "getBitsetIdent", 
function (bs, label, tokenValue, useAtomMap, index, isExplicitlyAll) {
var isAtoms = !(Clazz.instanceOf (tokenValue, J.modelset.Bond.BondSet));
if (isAtoms) {
if (label == null) label = this.viewer.getStandardLabelFormat (0);
 else if (label.length == 0) label = "%[label]";
}var pt = (label == null ? -1 : label.indexOf ("%"));
var haveIndex = (index != 2147483647);
if (bs == null || this.chk || isAtoms && pt < 0) {
if (label == null) label = "";
return isExplicitlyAll ? [label] : label;
}var modelSet = this.viewer.modelSet;
var n = 0;
var indices = (isAtoms || !useAtomMap ? null : (tokenValue).getAssociatedAtoms ());
if (indices == null && label != null && label.indexOf ("%D") > 0) indices = this.viewer.getAtomIndices (bs);
var asIdentity = (label == null || label.length == 0);
var htValues = (isAtoms || asIdentity ? null : J.modelset.LabelToken.getBondLabelValues ());
var tokens = (asIdentity ? null : isAtoms ? J.modelset.LabelToken.compile (this.viewer, label, '\0', null) : J.modelset.LabelToken.compile (this.viewer, label, '\1', htValues));
var nmax = (haveIndex ? 1 : J.util.BSUtil.cardinalityOf (bs));
var sout =  new Array (nmax);
for (var j = (haveIndex ? index : bs.nextSetBit (0)); j >= 0; j = bs.nextSetBit (j + 1)) {
var str;
if (isAtoms) {
if (asIdentity) str = modelSet.atoms[j].getInfo ();
 else str = J.modelset.LabelToken.formatLabelAtomArray (this.viewer, modelSet.atoms[j], tokens, '\0', indices);
} else {
var bond = modelSet.getBondAt (j);
if (asIdentity) str = bond.getIdentity ();
 else str = J.modelset.LabelToken.formatLabelBond (this.viewer, bond, tokens, htValues, indices);
}str = J.util.TextFormat.formatStringI (str, "#", (n + 1));
sout[n++] = str;
if (haveIndex) break;
}
return nmax == 1 && !isExplicitlyAll ? sout[0] : sout;
}, "J.util.BS,~S,~O,~B,~N,~B");
$_M(c$, "getBitsetPropertySelector", 
($fz = function (i, mustBeSettable) {
var tok = this.getToken (i).tok;
switch (tok) {
case 32:
case 64:
case 96:
case 192:
case 128:
case 160:
case 1716520973:
break;
default:
if (J.script.T.tokAttrOr (tok, 1078984704, 1141899264)) break;
if (tok != 806354977 && !J.script.T.tokAttr (tok, 1073741824)) return null;
var name = this.parameterAsString (i);
if (!mustBeSettable && this.viewer.isFunction (name)) {
tok = 135368713;
break;
}if (!name.endsWith ("?")) return null;
tok = 1073741824;
}
if (mustBeSettable && !J.script.T.tokAttr (tok, 2048)) return null;
return J.script.SV.newScriptVariableIntValue (269484241, tok, this.parameterAsString (i).toLowerCase ());
}, $fz.isPrivate = true, $fz), "~N,~B");
$_M(c$, "getBitsetPropertyFloat", 
($fz = function (bs, tok, min, max) {
var data = this.getBitsetProperty (bs, tok, null, null, null, null, false, 2147483647, false);
if (!Float.isNaN (min)) for (var i = 0; i < data.length; i++) if (data[i] < min) data[i] = NaN;

if (!Float.isNaN (max)) for (var i = 0; i < data.length; i++) if (data[i] > max) data[i] = NaN;

return data;
}, $fz.isPrivate = true, $fz), "J.util.BS,~N,~N,~N");
$_M(c$, "getBitsetProperty", 
function (bs, tok, ptRef, planeRef, tokenValue, opValue, useAtomMap, index, asVectorIfAll) {
var haveIndex = (index != 2147483647);
var isAtoms = haveIndex || !(Clazz.instanceOf (tokenValue, J.modelset.Bond.BondSet));
var minmaxtype = tok & 480;
var selectedFloat = (minmaxtype == 224);
var atomCount = this.viewer.getAtomCount ();
var fout = (minmaxtype == 256 ?  Clazz.newFloatArray (atomCount, 0) : null);
var isExplicitlyAll = (minmaxtype == 480 || selectedFloat);
tok &= -481;
if (tok == 0) tok = (isAtoms ? 1141899265 : 1678770178);
var isPt = false;
var isInt = false;
var isString = false;
switch (tok) {
case 1146095626:
case 1146095631:
case 1146095627:
case 1146095629:
case 1146093582:
case 1766856708:
case 1146095628:
isPt = true;
break;
case 135368713:
case 1276118018:
break;
default:
isInt = J.script.T.tokAttr (tok, 1095761920) && !J.script.T.tokAttr (tok, 1112539136);
isString = !isInt && J.script.T.tokAttr (tok, 1087373312);
}
var zero = (minmaxtype == 256 ?  new J.util.P3 () : null);
var pt = (isPt || !isAtoms ?  new J.util.P3 () : null);
if (isExplicitlyAll || isString && !haveIndex && minmaxtype != 256 && minmaxtype != 32) minmaxtype = 1048579;
var vout = (minmaxtype == 1048579 ?  new J.util.JmolList () : null);
var bsNew = null;
var userFunction = null;
var params = null;
var bsAtom = null;
var tokenAtom = null;
var ptT = null;
var data = null;
switch (tok) {
case 1141899265:
case 1678770178:
if (this.chk) return bs;
bsNew = (tok == 1141899265 ? (isAtoms ? bs : this.viewer.getAtomBits (1678770178, bs)) : (isAtoms ?  new J.modelset.Bond.BondSet (this.viewer.getBondsForSelectedAtoms (bs)) : bs));
var i;
switch (minmaxtype) {
case 32:
i = bsNew.nextSetBit (0);
break;
case 64:
i = bsNew.length () - 1;
break;
case 192:
case 128:
case 160:
return Float.$valueOf (NaN);
default:
return bsNew;
}
bsNew.clearAll ();
if (i >= 0) bsNew.set (i);
return bsNew;
case 1087373321:
switch (minmaxtype) {
case 0:
case 1048579:
return this.getBitsetIdent (bs, null, tokenValue, useAtomMap, index, isExplicitlyAll);
}
return "";
case 135368713:
userFunction = (opValue)[0];
params = (opValue)[1];
bsAtom = J.util.BSUtil.newBitSet (atomCount);
tokenAtom = J.script.SV.newVariable (10, bsAtom);
break;
case 1112539148:
case 1112539149:
this.viewer.autoCalculate (tok);
break;
case 1276118018:
if (ptRef == null && planeRef == null) return  new J.util.P3 ();
break;
case 1766856708:
ptT =  new J.util.P3 ();
break;
case 1716520973:
data = this.viewer.getDataFloat (opValue);
break;
}
var n = 0;
var ivvMinMax = 0;
var ivMinMax = 0;
var fvMinMax = 0;
var sum = 0;
var sum2 = 0;
switch (minmaxtype) {
case 32:
ivMinMax = 2147483647;
fvMinMax = 3.4028235E38;
break;
case 64:
ivMinMax = -2147483648;
fvMinMax = -3.4028235E38;
break;
}
var modelSet = this.viewer.modelSet;
var mode = (isPt ? 3 : isString ? 2 : isInt ? 1 : 0);
if (isAtoms) {
var haveBitSet = (bs != null);
var iModel = -1;
var i0;
var i1;
if (haveIndex) {
i0 = index;
i1 = index + 1;
} else if (haveBitSet) {
i0 = bs.nextSetBit (0);
i1 = Math.min (atomCount, bs.length ());
} else {
i0 = 0;
i1 = atomCount;
}if (this.chk) i1 = 0;
for (var i = i0; i >= 0 && i < i1; i = (haveBitSet ? bs.nextSetBit (i + 1) : i + 1)) {
n++;
var atom = modelSet.atoms[i];
switch (mode) {
case 0:
var fv = 3.4028235E38;
switch (tok) {
case 135368713:
bsAtom.set (i);
fv = J.script.SV.fValue (this.runFunctionRet (null, userFunction, params, tokenAtom, true, true, false));
bsAtom.clear (i);
break;
case 1716520973:
fv = (data == null ? 0 : data[i]);
break;
case 1276118018:
if (planeRef != null) fv = J.util.Measure.distanceToPlane (planeRef, atom);
 else fv = atom.distance (ptRef);
break;
default:
fv = J.modelset.Atom.atomPropertyFloat (this.viewer, atom, tok);
}
if (fv == 3.4028235E38 || Float.isNaN (fv) && minmaxtype != 1048579) {
n--;
continue;
}switch (minmaxtype) {
case 32:
if (fv < fvMinMax) fvMinMax = fv;
break;
case 64:
if (fv > fvMinMax) fvMinMax = fv;
break;
case 256:
fout[i] = fv;
break;
case 1048579:
vout.addLast (Float.$valueOf (fv));
break;
case 160:
case 192:
sum2 += (fv) * fv;
case 128:
default:
sum += fv;
}
break;
case 1:
var iv = 0;
switch (tok) {
case 1297090050:
if (atom.getModelIndex () != iModel) iModel = atom.getModelIndex ();
var bsSym = atom.getAtomSymmetry ();
if (bsSym == null) break;
var p = 0;
switch (minmaxtype) {
case 32:
ivvMinMax = 2147483647;
break;
case 64:
ivvMinMax = -2147483648;
break;
}
for (var k = bsSym.nextSetBit (0); k >= 0; k = bsSym.nextSetBit (k + 1)) {
iv += k + 1;
switch (minmaxtype) {
case 32:
ivvMinMax = Math.min (ivvMinMax, k + 1);
break;
case 64:
ivvMinMax = Math.max (ivvMinMax, k + 1);
break;
}
p++;
}
switch (minmaxtype) {
case 32:
case 64:
iv = ivvMinMax;
}
n += p - 1;
break;
case 1095766022:
case 1095761925:
this.errorStr (45, J.script.T.nameOf (tok));
break;
default:
iv = J.modelset.Atom.atomPropertyInt (atom, tok);
}
switch (minmaxtype) {
case 32:
if (iv < ivMinMax) ivMinMax = iv;
break;
case 64:
if (iv > ivMinMax) ivMinMax = iv;
break;
case 256:
fout[i] = iv;
break;
case 1048579:
vout.addLast (Integer.$valueOf (iv));
break;
case 160:
case 192:
sum2 += (iv) * iv;
case 128:
default:
sum += iv;
}
break;
case 2:
var s = J.modelset.Atom.atomPropertyString (this.viewer, atom, tok);
switch (minmaxtype) {
case 256:
fout[i] = J.util.Parser.parseFloatStr (s);
break;
default:
if (vout == null) return s;
vout.addLast (s);
}
break;
case 3:
var t = J.modelset.Atom.atomPropertyTuple (atom, tok);
if (t == null) this.errorStr (45, J.script.T.nameOf (tok));
switch (minmaxtype) {
case 256:
fout[i] = Math.sqrt (t.x * t.x + t.y * t.y + t.z * t.z);
break;
case 1048579:
vout.addLast (J.util.P3.newP (t));
break;
default:
pt.add (t);
}
break;
}
if (haveIndex) break;
}
} else {
var isAll = (bs == null);
var i0 = (isAll ? 0 : bs.nextSetBit (0));
var i1 = this.viewer.getBondCount ();
for (var i = i0; i >= 0 && i < i1; i = (isAll ? i + 1 : bs.nextSetBit (i + 1))) {
n++;
var bond = modelSet.getBondAt (i);
switch (tok) {
case 1141899267:
var fv = bond.getAtom1 ().distance (bond.getAtom2 ());
switch (minmaxtype) {
case 32:
if (fv < fvMinMax) fvMinMax = fv;
break;
case 64:
if (fv > fvMinMax) fvMinMax = fv;
break;
case 1048579:
vout.addLast (Float.$valueOf (fv));
break;
case 160:
case 192:
sum2 += fv * fv;
case 128:
default:
sum += fv;
}
break;
case 1146095626:
switch (minmaxtype) {
case 1048579:
pt.setT (bond.getAtom1 ());
pt.add (bond.getAtom2 ());
pt.scale (0.5);
vout.addLast (J.util.P3.newP (pt));
break;
default:
pt.add (bond.getAtom1 ());
pt.add (bond.getAtom2 ());
n++;
}
break;
case 1766856708:
J.util.ColorUtil.colorPointFromInt (this.viewer.getColorArgbOrGray (bond.colix), ptT);
switch (minmaxtype) {
case 1048579:
vout.addLast (J.util.P3.newP (ptT));
break;
default:
pt.add (ptT);
}
break;
default:
this.errorStr (46, J.script.T.nameOf (tok));
}
}
}if (minmaxtype == 256) return fout;
if (minmaxtype == 1048579) {
if (asVectorIfAll) return vout;
var len = vout.size ();
if (isString && !isExplicitlyAll && len == 1) return vout.get (0);
if (selectedFloat) {
fout =  Clazz.newFloatArray (len, 0);
for (var i = len; --i >= 0; ) {
var v = vout.get (i);
switch (mode) {
case 0:
fout[i] = (v).floatValue ();
break;
case 1:
fout[i] = (v).floatValue ();
break;
case 2:
fout[i] = J.util.Parser.parseFloatStr (v);
break;
case 3:
fout[i] = (v).distance (zero);
break;
}
}
return fout;
}if (tok == 1087373320) {
var sb =  new J.util.SB ();
for (var i = 0; i < len; i++) sb.append (vout.get (i));

return sb.toString ();
}var sout =  new Array (len);
for (var i = len; --i >= 0; ) {
var v = vout.get (i);
if (Clazz.instanceOf (v, J.util.P3)) sout[i] = J.util.Escape.eP (v);
 else sout[i] = "" + vout.get (i);
}
return sout;
}if (isPt) return (n == 0 ? pt : J.util.P3.new3 (pt.x / n, pt.y / n, pt.z / n));
if (n == 0 || n == 1 && minmaxtype == 192) return Float.$valueOf (NaN);
if (isInt) {
switch (minmaxtype) {
case 32:
case 64:
return Integer.$valueOf (ivMinMax);
case 160:
case 192:
break;
case 128:
return Integer.$valueOf (Clazz.doubleToInt (sum));
default:
if (sum / n == Clazz.doubleToInt (sum / n)) return Integer.$valueOf (Clazz.doubleToInt (sum / n));
return Float.$valueOf ((sum / n));
}
}switch (minmaxtype) {
case 32:
case 64:
sum = fvMinMax;
break;
case 128:
break;
case 160:
sum = sum2;
break;
case 192:
sum = Math.sqrt ((sum2 - sum * sum / n) / (n - 1));
break;
default:
sum /= n;
break;
}
return Float.$valueOf (sum);
}, "J.util.BS,~N,J.util.P3,J.util.P4,~O,~O,~B,~N,~B");
$_M(c$, "setBitsetProperty", 
($fz = function (bs, tok, iValue, fValue, tokenValue) {
if (this.chk || J.util.BSUtil.cardinalityOf (bs) == 0) return;
var list = null;
var sValue = null;
var fvalues = null;
var pt;
var sv = null;
var nValues = 0;
var isStrProperty = J.script.T.tokAttr (tok, 1087373312);
if (tokenValue.tok == 7) {
sv = (tokenValue).getList ();
if ((nValues = sv.size ()) == 0) return;
}switch (tok) {
case 1146095626:
case 1146095627:
case 1146095629:
case 1146095631:
switch (tokenValue.tok) {
case 8:
this.viewer.setAtomCoords (bs, tok, tokenValue.value);
break;
case 7:
this.theToken = tokenValue;
this.viewer.setAtomCoords (bs, tok, this.getPointArray (-1, nValues));
break;
}
return;
case 1766856708:
var value = null;
var prop = "color";
switch (tokenValue.tok) {
case 7:
var values =  Clazz.newIntArray (nValues, 0);
for (var i = nValues; --i >= 0; ) {
var svi = sv.get (i);
pt = J.script.SV.ptValue (svi);
if (pt != null) {
values[i] = J.util.ColorUtil.colorPtToInt (pt);
} else if (svi.tok == 2) {
values[i] = svi.intValue;
} else {
values[i] = J.util.ColorUtil.getArgbFromString (svi.asString ());
if (values[i] == 0) values[i] = svi.asInt ();
}if (values[i] == 0) this.errorStr2 (50, "ARRAY", svi.asString ());
}
value = values;
prop = "colorValues";
break;
case 8:
value = Integer.$valueOf (J.util.ColorUtil.colorPtToInt (tokenValue.value));
break;
case 4:
value = tokenValue.value;
break;
default:
value = Integer.$valueOf (J.script.SV.iValue (tokenValue));
break;
}
this.setShapePropertyBs (0, prop, value, bs);
return;
case 1826248715:
case 1288701960:
if (tokenValue.tok != 7) sValue = J.script.SV.sValue (tokenValue);
break;
case 1087375365:
case 1095763976:
this.clearDefinedVariableAtomSets ();
isStrProperty = false;
break;
}
switch (tokenValue.tok) {
case 7:
if (isStrProperty) list = J.script.SV.listValue (tokenValue);
 else fvalues = J.script.SV.flistValue (tokenValue, nValues);
break;
case 4:
if (sValue == null) list = J.util.Parser.getTokens (J.script.SV.sValue (tokenValue));
break;
}
if (list != null) {
nValues = list.length;
if (!isStrProperty) {
fvalues =  Clazz.newFloatArray (nValues, 0);
for (var i = nValues; --i >= 0; ) fvalues[i] = (tok == 1087375365 ? J.util.Elements.elementNumberFromSymbol (list[i], false) : J.util.Parser.parseFloatStr (list[i]));

}if (tokenValue.tok != 7 && nValues == 1) {
if (isStrProperty) sValue = list[0];
 else fValue = fvalues[0];
iValue = Clazz.floatToInt (fValue);
list = null;
fvalues = null;
}}this.viewer.setAtomProperty (bs, tok, iValue, fValue, sValue, fvalues, list);
}, $fz.isPrivate = true, $fz), "J.util.BS,~N,~N,~N,J.script.T");
Clazz.overrideMethod (c$, "getContextVariables", 
function () {
return this.contextVariables;
});
Clazz.overrideMethod (c$, "getScript", 
function () {
return this.$script;
});
$_M(c$, "compileScript", 
($fz = function (filename, strScript, debugCompiler) {
this.scriptFileName = filename;
strScript = this.fixScriptPath (strScript, filename);
this.restoreScriptContext (this.compiler.compile (filename, strScript, false, false, debugCompiler, false), false, false, false);
this.isStateScript = (this.$script.indexOf ("# Jmol state version ") >= 0);
this.forceNoAddHydrogens = (this.isStateScript && this.$script.indexOf ("pdbAddHydrogens") < 0);
var s = this.$script;
this.pc = this.setScriptExtensions ();
if (!this.chk && this.viewer.scriptEditorVisible && strScript.indexOf ("\u0001## EDITOR_IGNORE ##") < 0) this.viewer.scriptStatus ("");
this.$script = s;
return !this.$error;
}, $fz.isPrivate = true, $fz), "~S,~S,~B");
$_M(c$, "fixScriptPath", 
($fz = function (strScript, filename) {
if (filename != null && strScript.indexOf ("$SCRIPT_PATH$") >= 0) {
var path = filename;
var pt = Math.max (filename.lastIndexOf ("|"), filename.lastIndexOf ("/"));
path = path.substring (0, pt + 1);
strScript = J.util.TextFormat.simpleReplace (strScript, "$SCRIPT_PATH$/", path);
strScript = J.util.TextFormat.simpleReplace (strScript, "$SCRIPT_PATH$", path);
}return strScript;
}, $fz.isPrivate = true, $fz), "~S,~S");
$_M(c$, "setScriptExtensions", 
($fz = function () {
var extensions = this.scriptExtensions;
if (extensions == null) return 0;
var pt = extensions.indexOf ("##SCRIPT_STEP");
if (pt >= 0) {
this.executionStepping = true;
}pt = extensions.indexOf ("##SCRIPT_START=");
if (pt < 0) return 0;
pt = J.util.Parser.parseInt (extensions.substring (pt + 15));
if (pt == -2147483648) return 0;
for (this.pc = 0; this.pc < this.lineIndices.length; this.pc++) {
if (this.lineIndices[this.pc][0] > pt || this.lineIndices[this.pc][1] >= pt) break;
}
if (this.pc > 0 && this.pc < this.lineIndices.length && this.lineIndices[this.pc][0] > pt) --this.pc;
return this.pc;
}, $fz.isPrivate = true, $fz));
Clazz.overrideMethod (c$, "runScript", 
function (script) {
if (!this.viewer.isPreviewOnly ()) this.runScriptBuffer (script, this.outputBuffer);
}, "~S");
$_M(c$, "compileScriptFileInternal", 
($fz = function (filename, localPath, remotePath, scriptPath) {
if (filename.toLowerCase ().indexOf ("javascript:") == 0) return this.compileScript (filename, this.viewer.jsEval (filename.substring (11)), this.debugScript);
var data =  new Array (2);
data[0] = filename;
if (!this.viewer.getFileAsStringBin (data, 2147483647, false)) {
this.setErrorMessage ("io error reading " + data[0] + ": " + data[1]);
return false;
}if (("\n" + data[1]).indexOf ("\nJmolManifest.txt\n") >= 0) {
var path;
if (filename.endsWith (".all.pngj") || filename.endsWith (".all.png")) {
path = "|state.spt";
filename += "|";
} else {
data[0] = filename += "|JmolManifest.txt";
if (!this.viewer.getFileAsStringBin (data, 2147483647, false)) {
this.setErrorMessage ("io error reading " + data[0] + ": " + data[1]);
return false;
}path = J.io.JmolBinary.getManifestScriptPath (data[1]);
}if (path != null && path.length > 0) {
data[0] = filename = filename.substring (0, filename.lastIndexOf ("|")) + path;
if (!this.viewer.getFileAsStringBin (data, 2147483647, false)) {
this.setErrorMessage ("io error reading " + data[0] + ": " + data[1]);
return false;
}}}this.scriptFileName = filename;
data[1] = J.io.JmolBinary.getEmbeddedScript (data[1]);
var script = this.fixScriptPath (data[1], data[0]);
if (scriptPath == null) {
scriptPath = this.viewer.getFilePath (filename, false);
scriptPath = scriptPath.substring (0, Math.max (scriptPath.lastIndexOf ("|"), scriptPath.lastIndexOf ("/")));
}script = J.viewer.FileManager.setScriptFileReferences (script, localPath, remotePath, scriptPath);
return this.compileScript (filename, script, this.debugScript);
}, $fz.isPrivate = true, $fz), "~S,~S,~S,~S");
$_M(c$, "getParameter", 
($fz = function (key, tokType) {
var v = this.getContextVariableAsVariable (key);
if (v == null) v = this.viewer.getParameter (key);
switch (tokType) {
case 1073742190:
return J.script.SV.getVariable (v);
case 4:
if (!(Clazz.instanceOf (v, J.util.JmolList))) break;
var sv = v;
var sb =  new J.util.SB ();
for (var i = 0; i < sv.size (); i++) sb.append (sv.get (i).asString ()).appendC ('\n');

return sb.toString ();
}
return (Clazz.instanceOf (v, J.script.SV) ? J.script.SV.oValue (v) : v);
}, $fz.isPrivate = true, $fz), "~S,~N");
$_M(c$, "getParameterEscaped", 
($fz = function ($var) {
var v = this.getContextVariableAsVariable ($var);
return (v == null ? "" + this.viewer.getParameterEscaped ($var) : v.escape ());
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "getStringParameter", 
($fz = function ($var, orReturnName) {
var v = this.getContextVariableAsVariable ($var);
if (v != null) return v.asString ();
var val = "" + this.viewer.getParameter ($var);
return (val.length == 0 && orReturnName ? $var : val);
}, $fz.isPrivate = true, $fz), "~S,~B");
$_M(c$, "getNumericParameter", 
($fz = function ($var) {
if ($var.equalsIgnoreCase ("_modelNumber")) {
var modelIndex = this.viewer.getCurrentModelIndex ();
return Integer.$valueOf (modelIndex < 0 ? 0 : this.viewer.getModelFileNumber (modelIndex));
}var v = this.getContextVariableAsVariable ($var);
if (v == null) {
var val = this.viewer.getParameter ($var);
if (!(Clazz.instanceOf (val, String))) return val;
v = J.script.SV.newVariable (4, val);
}return J.script.SV.nValue (v);
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "getContextVariableAsVariable", 
($fz = function ($var) {
if ($var.equals ("expressionBegin")) return null;
$var = $var.toLowerCase ();
if (this.contextVariables != null && this.contextVariables.containsKey ($var)) return this.contextVariables.get ($var);
var context = this.thisContext;
while (context != null) {
if (context.isFunction == true) return null;
if (context.contextVariables != null && context.contextVariables.containsKey ($var)) return context.contextVariables.get ($var);
context = context.parentContext;
}
return null;
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "getStringObjectAsVariable", 
($fz = function (s, key) {
if (s == null || s.length == 0) return s;
var v = J.script.SV.unescapePointOrBitsetAsVariable (s);
if (Clazz.instanceOf (v, String) && key != null) v = this.viewer.setUserVariable (key, J.script.SV.newVariable (4, v));
return v;
}, $fz.isPrivate = true, $fz), "~S,~S");
Clazz.overrideMethod (c$, "evalFunctionFloat", 
function (func, params, values) {
try {
var p = params;
for (var i = 0; i < values.length; i++) p.get (i).value = Float.$valueOf (values[i]);

var f = func;
return J.script.SV.fValue (this.runFunctionRet (f, f.name, p, null, true, false, false));
} catch (e) {
if (Clazz.exceptionOf (e, Exception)) {
return NaN;
} else {
throw e;
}
}
}, "~O,~O,~A");
$_M(c$, "runFunctionRet", 
function ($function, name, params, tokenAtom, getReturn, setContextPath, allowThreads) {
if ($function == null) {
$function = this.viewer.getFunction (name);
if ($function == null) return null;
if (setContextPath) this.contextPath += " >> function " + name;
} else if (setContextPath) {
this.contextPath += " >> " + name;
}this.pushContext (null);
if (this.allowJSThreads) this.allowJSThreads = allowThreads;
var isTry = ($function.getTok () == 364558);
this.thisContext.isTryCatch = isTry;
this.thisContext.isFunction = !isTry;
this.functionName = name;
if (isTry) {
this.viewer.resetError ();
this.thisContext.displayLoadErrorsSave = this.viewer.displayLoadErrors;
this.thisContext.tryPt = ($t$ = ++ J.script.ScriptEvaluator.tryPt, J.script.ScriptEvaluator.prototype.tryPt = J.script.ScriptEvaluator.tryPt, $t$);
this.viewer.displayLoadErrors = false;
this.restoreFunction ($function, params, tokenAtom);
this.contextVariables.put ("_breakval", J.script.SV.newScriptVariableInt (2147483647));
this.contextVariables.put ("_errorval", J.script.SV.newVariable (4, ""));
var cv = this.contextVariables;
this.executeCommands (true);
while (this.thisContext.tryPt != J.script.ScriptEvaluator.tryPt) this.popContext (false, false);

this.processTry (cv);
return null;
} else if (Clazz.instanceOf ($function, J.api.JmolParallelProcessor)) {
{
this.parallelProcessor = $function;
this.restoreFunction ($function, params, tokenAtom);
this.dispatchCommands (false, true);
($function).runAllProcesses (this.viewer);
}} else {
this.restoreFunction ($function, params, tokenAtom);
this.dispatchCommands (false, true);
}var v = (getReturn ? this.getContextVariableAsVariable ("_retval") : null);
this.popContext (false, false);
return v;
}, "J.api.JmolScriptFunction,~S,J.util.JmolList,J.script.SV,~B,~B,~B");
$_M(c$, "processTry", 
($fz = function (cv) {
this.viewer.displayLoadErrors = this.thisContext.displayLoadErrorsSave;
this.popContext (false, false);
var err = this.viewer.getParameter ("_errormessage");
if (err.length > 0) {
cv.put ("_errorval", J.script.SV.newVariable (4, err));
this.viewer.resetError ();
}cv.put ("_tryret", cv.get ("_retval"));
var ret = cv.get ("_tryret");
if (ret.value != null || ret.intValue != 2147483647) {
this.returnCmd (ret);
return;
}var errMsg = (cv.get ("_errorval")).value;
if (errMsg.length == 0) {
var iBreak = (cv.get ("_breakval")).intValue;
if (iBreak != 2147483647) {
this.breakCmd (this.pc - iBreak);
return;
}}if (this.pc + 1 < this.aatoken.length && this.aatoken[this.pc + 1][0].tok == 102412) {
var ct = this.aatoken[this.pc + 1][0];
if (ct.contextVariables != null && ct.name0 != null) ct.contextVariables.put (ct.name0, J.script.SV.newVariable (4, errMsg));
ct.intValue = (errMsg.length > 0 ? 1 : -1) * Math.abs (ct.intValue);
}}, $fz.isPrivate = true, $fz), "java.util.Map");
$_M(c$, "restoreFunction", 
($fz = function (f, params, tokenAtom) {
var $function = f;
this.aatoken = $function.aatoken;
this.lineNumbers = $function.lineNumbers;
this.lineIndices = $function.lineIndices;
this.$script = $function.script;
this.pc = 0;
if ($function.names != null) {
this.contextVariables =  new java.util.Hashtable ();
$function.setVariables (this.contextVariables, params);
}if (tokenAtom != null) this.contextVariables.put ("_x", tokenAtom);
}, $fz.isPrivate = true, $fz), "J.api.JmolScriptFunction,J.util.JmolList,J.script.SV");
$_M(c$, "clearDefinedVariableAtomSets", 
($fz = function () {
this.definedAtomSets.remove ("# variable");
}, $fz.isPrivate = true, $fz));
$_M(c$, "defineSets", 
($fz = function () {
if (!this.definedAtomSets.containsKey ("# static")) {
for (var i = 0; i < J.viewer.JC.predefinedStatic.length; i++) this.defineAtomSet (J.viewer.JC.predefinedStatic[i]);

this.defineAtomSet ("# static");
}if (this.definedAtomSets.containsKey ("# variable")) return;
for (var i = 0; i < J.viewer.JC.predefinedVariable.length; i++) this.defineAtomSet (J.viewer.JC.predefinedVariable[i]);

for (var i = J.util.Elements.elementNumberMax; --i >= 0; ) {
var definition = " elemno=" + i;
this.defineAtomSet ("@" + J.util.Elements.elementNameFromNumber (i) + definition);
this.defineAtomSet ("@_" + J.util.Elements.elementSymbolFromNumber (i) + definition);
}
for (var i = 4; --i >= 0; ) {
var definition = "@" + J.util.Elements.altElementNameFromIndex (i) + " _e=" + J.util.Elements.altElementNumberFromIndex (i);
this.defineAtomSet (definition);
}
for (var i = J.util.Elements.altElementMax; --i >= 4; ) {
var ei = J.util.Elements.altElementNumberFromIndex (i);
var def = " _e=" + ei;
var definition = "@_" + J.util.Elements.altElementSymbolFromIndex (i);
this.defineAtomSet (definition + def);
definition = "@_" + J.util.Elements.altIsotopeSymbolFromIndex (i);
this.defineAtomSet (definition + def);
definition = "@_" + J.util.Elements.altIsotopeSymbolFromIndex2 (i);
this.defineAtomSet (definition + def);
definition = "@" + J.util.Elements.altElementNameFromIndex (i);
if (definition.length > 1) this.defineAtomSet (definition + def);
var e = J.util.Elements.getElementNumber (ei);
ei = J.util.Elements.getNaturalIsotope (e);
if (ei > 0) {
def = J.util.Elements.elementSymbolFromNumber (e);
this.defineAtomSet ("@_" + def + ei + " _e=" + e);
this.defineAtomSet ("@_" + ei + def + " _e=" + e);
}}
this.defineAtomSet ("# variable");
}, $fz.isPrivate = true, $fz));
$_M(c$, "defineAtomSet", 
($fz = function (script) {
if (script.indexOf ("#") == 0) {
this.definedAtomSets.put (script, Boolean.TRUE);
return;
}var sc = this.compiler.compile ("#predefine", script, true, false, false, false);
if (sc.errorType != null) {
this.viewer.scriptStatus ("JmolConstants.java ERROR: predefined set compile error:" + script + "\ncompile error:" + sc.errorMessageUntranslated);
return;
}if (sc.aatoken.length != 1) {
this.viewer.scriptStatus ("JmolConstants.java ERROR: predefinition does not have exactly 1 command:" + script);
return;
}var statement = sc.aatoken[0];
if (statement.length <= 2) {
this.viewer.scriptStatus ("JmolConstants.java ERROR: bad predefinition length:" + script);
return;
}var tok = statement[1].tok;
if (!J.script.T.tokAttr (tok, 1073741824) && !J.script.T.tokAttr (tok, 3145728)) {
this.viewer.scriptStatus ("JmolConstants.java ERROR: invalid variable name:" + script);
return;
}var name = (statement[1].value).toLowerCase ();
if (name.startsWith ("dynamic_")) name = "!" + name.substring (8);
this.definedAtomSets.put (name, statement);
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "lookupIdentifierValue", 
($fz = function (identifier) {
var bs = this.lookupValue (identifier, false);
if (bs != null) return J.util.BSUtil.copy (bs);
bs = this.getAtomBits (1073741824, identifier);
return (bs == null ?  new J.util.BS () : bs);
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "lookupValue", 
($fz = function (setName, plurals) {
if (this.chk) {
return  new J.util.BS ();
}this.defineSets ();
setName = setName.toLowerCase ();
var value = this.definedAtomSets.get (setName);
var isDynamic = false;
if (value == null) {
value = this.definedAtomSets.get ("!" + setName);
isDynamic = (value != null);
}if (Clazz.instanceOf (value, J.util.BS)) return value;
if (Clazz.instanceOf (value, Array)) {
this.pushContext (null);
var bs = this.atomExpression (value, -2, 0, true, false, true, true);
this.popContext (false, false);
if (!isDynamic) this.definedAtomSets.put (setName, bs);
return bs;
}if (plurals) return null;
var len = setName.length;
if (len < 5) return null;
if (setName.charAt (len - 1) != 's') return null;
if (setName.endsWith ("ies")) setName = setName.substring (0, len - 3) + 'y';
 else setName = setName.substring (0, len - 1);
return this.lookupValue (setName, true);
}, $fz.isPrivate = true, $fz), "~S,~B");
Clazz.overrideMethod (c$, "deleteAtomsInVariables", 
function (bsDeleted) {
for (var entry, $entry = this.definedAtomSets.entrySet ().iterator (); $entry.hasNext () && ((entry = $entry.next ()) || true);) {
var value = entry.getValue ();
if (Clazz.instanceOf (value, J.util.BS)) {
J.util.BSUtil.deleteBits (value, bsDeleted);
if (!entry.getKey ().startsWith ("!")) this.viewer.setUserVariable ("@" + entry.getKey (), J.script.SV.newVariable (10, value));
}}
}, "J.util.BS");
$_M(c$, "setStatement", 
($fz = function (pc) {
this.st = this.aatoken[pc];
this.slen = this.st.length;
if (this.slen == 0) return true;
var fixed;
var i;
var tok;
for (i = 1; i < this.slen; i++) {
if (this.st[i] == null) {
this.slen = i;
return true;
}if (this.st[i].tok == 1060866) break;
}
if (i == this.slen) return i == this.slen;
switch (this.st[0].tok) {
case 102436:
case 135368713:
case 1073741824:
if (this.tokAt (1) == 269484048) return true;
}
fixed =  new Array (this.slen);
fixed[0] = this.st[0];
var isExpression = false;
var j = 1;
for (i = 1; i < this.slen; i++) {
if (this.st[i] == null) continue;
switch (tok = this.getToken (i).tok) {
default:
fixed[j] = this.st[i];
break;
case 1048577:
case 1048578:
isExpression = (tok == 1048577);
fixed[j] = this.st[i];
break;
case 1060866:
if (++i == this.slen) this.error (22);
var v;
var forceString = (this.theToken.intValue == 4);
var s;
var $var = this.parameterAsString (i);
var isClauseDefine = (this.tokAt (i) == 1048577);
var isSetAt = (j == 1 && this.st[0] === J.script.T.tokenSetCmd);
if (isClauseDefine) {
var vt = this.parameterExpressionToken (++i);
i = this.iToken;
v = (vt.tok == 7 ? vt : J.script.SV.oValue (vt));
} else {
if (this.tokAt (i) == 2) {
v = this.viewer.getAtomBits (1095763969, Integer.$valueOf (this.st[i].intValue));
} else {
v = this.getParameter ($var, 0);
}if (!isExpression && !isSetAt) isClauseDefine = true;
}tok = this.tokAt (0);
forceString = new Boolean (forceString | (J.script.T.tokAttr (tok, 20480) || tok == 135271429)).valueOf ();
if (Clazz.instanceOf (v, J.script.SV)) {
fixed[j] = v;
if (isExpression && fixed[j].tok == 7) {
var bs = J.script.SV.getBitSet (v, true);
fixed[j] = J.script.SV.newVariable (10, bs == null ? this.getAtomBitSet (J.script.SV.sValue (fixed[j])) : bs);
}} else if (Clazz.instanceOf (v, Boolean)) {
fixed[j] = ((v).booleanValue () ? J.script.T.tokenOn : J.script.T.tokenOff);
} else if (Clazz.instanceOf (v, Integer)) {
fixed[j] = J.script.T.tv (2, (v).intValue (), v);
} else if (Clazz.instanceOf (v, Float)) {
fixed[j] = J.script.T.tv (3, J.script.ScriptEvaluator.getFloatEncodedInt ("" + v), v);
} else if (Clazz.instanceOf (v, String)) {
if (!forceString) {
if ((tok != 1085443 || j > 1 && this.st[1].tok != 537022465) && J.script.T.tokAttr (tok, 36864)) {
v = this.getParameter (v, 1073742190);
}if (Clazz.instanceOf (v, String)) {
v = this.getStringObjectAsVariable (v, null);
}}if (Clazz.instanceOf (v, J.script.SV)) {
fixed[j] = v;
} else {
s = v;
if (isExpression && !forceString) {
fixed[j] = J.script.T.o (10, this.getAtomBitSet (s));
} else {
if (!isExpression) {
}tok = (isSetAt ? J.script.T.getTokFromName (s) : isClauseDefine || forceString || s.length == 0 || s.indexOf (".") >= 0 || s.indexOf (" ") >= 0 || s.indexOf ("=") >= 0 || s.indexOf (";") >= 0 || s.indexOf ("[") >= 0 || s.indexOf ("{") >= 0 ? 4 : 1073741824);
fixed[j] = J.script.T.o (tok, v);
}}} else if (Clazz.instanceOf (v, J.util.BS)) {
fixed[j] = J.script.SV.newVariable (10, v);
} else if (Clazz.instanceOf (v, J.util.P3)) {
fixed[j] = J.script.SV.newVariable (8, v);
} else if (Clazz.instanceOf (v, J.util.P4)) {
fixed[j] = J.script.SV.newVariable (9, v);
} else if (Clazz.instanceOf (v, J.util.Matrix3f)) {
fixed[j] = J.script.SV.newVariable (11, v);
} else if (Clazz.instanceOf (v, J.util.Matrix4f)) {
fixed[j] = J.script.SV.newVariable (12, v);
} else if (Clazz.instanceOf (v, java.util.Map)) {
fixed[j] = J.script.SV.newVariable (6, v);
} else if (Clazz.instanceOf (v, J.util.JmolList)) {
var sv = v;
var bs = null;
for (var k = 0; k < sv.size (); k++) {
var svk = sv.get (k);
if (svk.tok != 10) {
bs = null;
break;
}if (bs == null) bs =  new J.util.BS ();
bs.or (svk.value);
}
fixed[j] = (bs == null ? J.script.SV.getVariable (v) : J.script.T.o (10, bs));
} else {
var center = this.getObjectCenter ($var, -2147483648, -2147483648);
if (center == null) this.error (22);
fixed[j] = J.script.T.o (8, center);
}if (isSetAt && !J.script.T.tokAttr (fixed[j].tok, 536870912)) this.error (22);
break;
}
j++;
}
this.st = fixed;
for (i = j; i < this.st.length; i++) this.st[i] = null;

this.slen = j;
return true;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "clearState", 
($fz = function (tQuiet) {
this.thisContext = null;
this.scriptLevel = 0;
this.setErrorMessage (null);
this.contextPath = "";
this.tQuiet = tQuiet;
}, $fz.isPrivate = true, $fz), "~B");
Clazz.overrideMethod (c$, "getThisContext", 
function () {
return this.thisContext;
});
Clazz.overrideMethod (c$, "pushContextDown", 
function () {
this.scriptLevel--;
this.pushContext2 (null);
});
$_M(c$, "pushContext", 
($fz = function (token) {
if (this.scriptLevel == 100) this.error (44);
this.pushContext2 (token);
}, $fz.isPrivate = true, $fz), "J.script.ContextToken");
$_M(c$, "pushContext2", 
($fz = function (token) {
this.thisContext = this.getScriptContext ();
this.thisContext.token = token;
if (token == null) {
this.scriptLevel = ++this.thisContext.scriptLevel;
} else {
this.thisContext.scriptLevel = -1;
this.contextVariables =  new java.util.Hashtable ();
if (token.contextVariables != null) for (var key, $key = token.contextVariables.keySet ().iterator (); $key.hasNext () && ((key = $key.next ()) || true);) J.script.ScriptCompiler.addContextVariable (this.contextVariables, key);

}if (this.debugScript || this.isCmdLine_c_or_C_Option) J.util.Logger.info ("-->>-------------".substring (0, Math.max (17, this.scriptLevel + 5)) + this.scriptLevel + " " + this.scriptFileName + " " + token + " " + this.thisContext);
}, $fz.isPrivate = true, $fz), "J.script.ContextToken");
Clazz.overrideMethod (c$, "getScriptContext", 
function () {
var context =  new J.script.ScriptContext ();
context.scriptLevel = this.scriptLevel;
context.parentContext = this.thisContext;
context.contextPath = this.contextPath;
context.scriptFileName = this.scriptFileName;
context.parallelProcessor = this.parallelProcessor;
context.functionName = this.functionName;
context.script = this.$script;
context.lineNumbers = this.lineNumbers;
context.lineIndices = this.lineIndices;
context.aatoken = this.aatoken;
context.statement = this.st;
context.statementLength = this.slen;
context.pc = this.pc;
context.lineEnd = this.lineEnd;
context.pcEnd = this.pcEnd;
context.iToken = this.iToken;
context.outputBuffer = this.outputBuffer;
context.contextVariables = this.contextVariables;
context.isStateScript = this.isStateScript;
context.errorMessage = this.errorMessage;
context.errorType = this.errorType;
context.iCommandError = this.iCommandError;
context.chk = this.chk;
context.executionStepping = this.executionStepping;
context.executionPaused = this.executionPaused;
context.scriptExtensions = this.scriptExtensions;
context.mustResumeEval = this.mustResumeEval;
context.allowJSThreads = this.allowJSThreads;
return context;
});
$_M(c$, "popContext", 
function (isFlowCommand, statementOnly) {
if (this.thisContext == null) return;
if (this.thisContext.scriptLevel > 0) this.scriptLevel = this.thisContext.scriptLevel - 1;
var scTemp = (isFlowCommand ? this.getScriptContext () : null);
this.restoreScriptContext (this.thisContext, true, isFlowCommand, statementOnly);
if (scTemp != null) this.restoreScriptContext (scTemp, true, false, true);
if (this.debugScript || this.isCmdLine_c_or_C_Option) J.util.Logger.info ("--<<-------------".substring (0, Math.max (17, this.scriptLevel + 5)) + this.scriptLevel + " " + this.scriptFileName + " " + (this.thisContext == null ? "" : "" + this.thisContext.token) + " " + this.thisContext);
}, "~B,~B");
$_M(c$, "restoreScriptContext", 
($fz = function (context, isPopContext, isFlowCommand, statementOnly) {
if (context == null) return;
if (!isFlowCommand) {
this.st = context.statement;
this.slen = context.statementLength;
this.pc = context.pc;
this.lineEnd = context.lineEnd;
this.pcEnd = context.pcEnd;
if (statementOnly) return;
}this.mustResumeEval = context.mustResumeEval;
this.$script = context.script;
this.lineNumbers = context.lineNumbers;
this.lineIndices = context.lineIndices;
this.aatoken = context.aatoken;
this.contextVariables = context.contextVariables;
this.scriptExtensions = context.scriptExtensions;
if (isPopContext) {
this.contextPath = context.contextPath;
this.scriptFileName = context.scriptFileName;
this.parallelProcessor = context.parallelProcessor;
this.functionName = context.functionName;
this.iToken = context.iToken;
this.outputBuffer = context.outputBuffer;
this.isStateScript = context.isStateScript;
this.thisContext = context.parentContext;
this.allowJSThreads = context.allowJSThreads;
} else {
this.$error = (context.errorType != null);
this.errorMessage = context.errorMessage;
this.errorMessageUntranslated = context.errorMessageUntranslated;
this.iCommandError = context.iCommandError;
this.errorType = context.errorType;
}}, $fz.isPrivate = true, $fz), "J.script.ScriptContext,~B,~B,~B");
$_M(c$, "getContext", 
($fz = function (withVariables) {
var sb =  new J.util.SB ();
var context = this.thisContext;
while (context != null) {
if (withVariables) {
if (context.contextVariables != null) {
sb.append (this.getScriptID (context));
sb.append (J.viewer.StateManager.getVariableList (context.contextVariables, 80, true, false));
}} else {
sb.append (J.script.ScriptEvaluator.setErrorLineMessage (context.functionName, context.scriptFileName, this.getLinenumber (context), context.pc, J.script.ScriptEvaluator.statementAsString (context.statement, -9999, this.logMessages)));
}context = context.parentContext;
}
if (withVariables) {
if (this.contextVariables != null) {
sb.append (this.getScriptID (null));
sb.append (J.viewer.StateManager.getVariableList (this.contextVariables, 80, true, false));
}} else {
sb.append (J.script.ScriptEvaluator.setErrorLineMessage (this.functionName, this.scriptFileName, this.getLinenumber (null), this.pc, J.script.ScriptEvaluator.statementAsString (this.st, -9999, this.logMessages)));
}return sb.toString ();
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "getLinenumber", 
($fz = function (c) {
return (c == null ? this.lineNumbers[this.pc] : c.lineNumbers[c.pc]);
}, $fz.isPrivate = true, $fz), "J.script.ScriptContext");
$_M(c$, "getScriptID", 
($fz = function (context) {
var fuName = (context == null ? this.functionName : "function " + context.functionName);
var fiName = (context == null ? this.scriptFileName : context.scriptFileName);
return "\n# " + fuName + " (file " + fiName + ")\n";
}, $fz.isPrivate = true, $fz), "J.script.ScriptContext");
Clazz.overrideMethod (c$, "setException", 
function (sx, msg, untranslated) {
sx.untranslated = (untranslated == null ? msg : untranslated);
this.errorType = msg;
this.iCommandError = this.pc;
if (sx.message == null) {
sx.message = "";
return;
}var s = J.script.ScriptEvaluator.getContextTrace (this.getScriptContext (), null, true).toString ();
while (this.thisContext != null && !this.thisContext.isTryCatch) this.popContext (false, false);

sx.message += s;
sx.untranslated += s;
if (this.thisContext != null || this.chk || msg.indexOf ("file recognized as a script file:") >= 0) return;
J.util.Logger.error ("eval ERROR: " + this.toString ());
if (this.viewer.autoExit) this.viewer.exitJmol ();
}, "J.script.ScriptException,~S,~S");
Clazz.overrideMethod (c$, "getErrorMessage", 
function () {
return this.errorMessage;
});
Clazz.overrideMethod (c$, "getErrorMessageUntranslated", 
function () {
return this.errorMessageUntranslated == null ? this.errorMessage : this.errorMessageUntranslated;
});
$_M(c$, "setErrorMessage", 
($fz = function (err) {
this.errorMessageUntranslated = null;
if (err == null) {
this.$error = false;
this.errorType = null;
this.errorMessage = null;
this.iCommandError = -1;
return;
}this.$error = true;
if (this.errorMessage == null) this.errorMessage = J.i18n.GT._ ("script ERROR: ");
this.errorMessage += err;
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "planeExpected", 
($fz = function () {
this.errorMore (38, "{a b c d}", "\"xy\" \"xz\" \"yz\" \"x=...\" \"y=...\" \"z=...\"", "$xxxxx");
}, $fz.isPrivate = true, $fz));
$_M(c$, "integerOutOfRange", 
($fz = function (min, max) {
this.errorStr2 (21, "" + min, "" + max);
}, $fz.isPrivate = true, $fz), "~N,~N");
$_M(c$, "numberOutOfRange", 
($fz = function (min, max) {
this.errorStr2 (36, "" + min, "" + max);
}, $fz.isPrivate = true, $fz), "~N,~N");
$_M(c$, "errorAt", 
function (iError, i) {
this.iToken = i;
this.errorOrWarn (iError, null, null, null, false);
}, "~N,~N");
$_M(c$, "error", 
function (iError) {
this.errorOrWarn (iError, null, null, null, false);
}, "~N");
$_M(c$, "errorStr", 
function (iError, value) {
this.errorOrWarn (iError, value, null, null, false);
}, "~N,~S");
$_M(c$, "errorStr2", 
function (iError, value, more) {
this.errorOrWarn (iError, value, more, null, false);
}, "~N,~S,~S");
$_M(c$, "errorMore", 
function (iError, value, more, more2) {
this.errorOrWarn (iError, value, more, more2, false);
}, "~N,~S,~S,~S");
$_M(c$, "warning", 
($fz = function (iError, value, more) {
this.errorOrWarn (iError, value, more, null, true);
}, $fz.isPrivate = true, $fz), "~N,~S,~S");
$_M(c$, "errorOrWarn", 
function (iError, value, more, more2, warningOnly) {
var strError = this.ignoreError ? null : J.script.ScriptEvaluator.errorString (iError, value, more, more2, true);
var strUntranslated = (!this.ignoreError && J.i18n.GT.getDoTranslate () ? J.script.ScriptEvaluator.errorString (iError, value, more, more2, false) : null);
if (!warningOnly) this.evalError (strError, strUntranslated);
this.showString (strError);
}, "~N,~S,~S,~S,~B");
$_M(c$, "evalError", 
function (message, strUntranslated) {
if (this.ignoreError) throw  new NullPointerException ();
if (!this.chk) {
this.setCursorWait (false);
this.viewer.setBooleanProperty ("refreshing", true);
this.viewer.setStringProperty ("_errormessage", strUntranslated);
}throw  new J.script.ScriptException (this, message, strUntranslated, true);
}, "~S,~S");
c$.errorString = $_M(c$, "errorString", 
function (iError, value, more, more2, translated) {
var doTranslate = false;
if (!translated && (doTranslate = J.i18n.GT.getDoTranslate ()) == true) J.i18n.GT.setDoTranslate (false);
var msg;
switch (iError) {
default:
msg = "Unknown error message number: " + iError;
break;
case 0:
msg = J.i18n.GT._ ("x y z axis expected");
break;
case 1:
msg = J.i18n.GT._ ("{0} not allowed with background model displayed");
break;
case 2:
msg = J.i18n.GT._ ("bad argument count");
break;
case 3:
msg = J.i18n.GT._ ("Miller indices cannot all be zero.");
break;
case 4:
msg = J.i18n.GT._ ("bad [R,G,B] color");
break;
case 5:
msg = J.i18n.GT._ ("boolean expected");
break;
case 6:
msg = J.i18n.GT._ ("boolean or number expected");
break;
case 7:
msg = J.i18n.GT._ ("boolean, number, or {0} expected");
break;
case 56:
msg = J.i18n.GT._ ("cannot set value");
break;
case 8:
msg = J.i18n.GT._ ("color expected");
break;
case 9:
msg = J.i18n.GT._ ("a color or palette name (Jmol, Rasmol) is required");
break;
case 10:
msg = J.i18n.GT._ ("command expected");
break;
case 11:
msg = J.i18n.GT._ ("{x y z} or $name or (atom expression) required");
break;
case 12:
msg = J.i18n.GT._ ("draw object not defined");
break;
case 13:
msg = J.i18n.GT._ ("unexpected end of script command");
break;
case 14:
msg = J.i18n.GT._ ("valid (atom expression) expected");
break;
case 15:
msg = J.i18n.GT._ ("(atom expression) or integer expected");
break;
case 16:
msg = J.i18n.GT._ ("filename expected");
break;
case 17:
msg = J.i18n.GT._ ("file not found");
break;
case 18:
msg = J.i18n.GT._ ("incompatible arguments");
break;
case 19:
msg = J.i18n.GT._ ("insufficient arguments");
break;
case 20:
msg = J.i18n.GT._ ("integer expected");
break;
case 21:
msg = J.i18n.GT._ ("integer out of range ({0} - {1})");
break;
case 22:
msg = J.i18n.GT._ ("invalid argument");
break;
case 23:
msg = J.i18n.GT._ ("invalid parameter order");
break;
case 24:
msg = J.i18n.GT._ ("keyword expected");
break;
case 25:
msg = J.i18n.GT._ ("no MO coefficient data available");
break;
case 26:
msg = J.i18n.GT._ ("An MO index from 1 to {0} is required");
break;
case 27:
msg = J.i18n.GT._ ("no MO basis/coefficient data available for this frame");
break;
case 28:
msg = J.i18n.GT._ ("no MO occupancy data available");
break;
case 29:
msg = J.i18n.GT._ ("Only one molecular orbital is available in this file");
break;
case 30:
msg = J.i18n.GT._ ("{0} require that only one model be displayed");
break;
case 55:
msg = J.i18n.GT._ ("{0} requires that only one model be loaded");
break;
case 31:
msg = J.i18n.GT._ ("No data available");
break;
case 32:
msg = J.i18n.GT._ ("No partial charges were read from the file; Jmol needs these to render the MEP data.");
break;
case 33:
msg = J.i18n.GT._ ("No unit cell");
break;
case 34:
msg = J.i18n.GT._ ("number expected");
break;
case 35:
msg = J.i18n.GT._ ("number must be ({0} or {1})");
break;
case 36:
msg = J.i18n.GT._ ("decimal number out of range ({0} - {1})");
break;
case 37:
msg = J.i18n.GT._ ("object name expected after '$'");
break;
case 38:
msg = J.i18n.GT._ ("plane expected -- either three points or atom expressions or {0} or {1} or {2}");
break;
case 39:
msg = J.i18n.GT._ ("property name expected");
break;
case 40:
msg = J.i18n.GT._ ("space group {0} was not found.");
break;
case 41:
msg = J.i18n.GT._ ("quoted string expected");
break;
case 42:
msg = J.i18n.GT._ ("quoted string or identifier expected");
break;
case 43:
msg = J.i18n.GT._ ("too many rotation points were specified");
break;
case 44:
msg = J.i18n.GT._ ("too many script levels");
break;
case 45:
msg = J.i18n.GT._ ("unrecognized atom property");
break;
case 46:
msg = J.i18n.GT._ ("unrecognized bond property");
break;
case 47:
msg = J.i18n.GT._ ("unrecognized command");
break;
case 48:
msg = J.i18n.GT._ ("runtime unrecognized expression");
break;
case 49:
msg = J.i18n.GT._ ("unrecognized object");
break;
case 50:
msg = J.i18n.GT._ ("unrecognized {0} parameter");
break;
case 51:
msg = J.i18n.GT._ ("unrecognized {0} parameter in Jmol state script (set anyway)");
break;
case 52:
msg = J.i18n.GT._ ("unrecognized SHOW parameter --  use {0}");
break;
case 53:
msg = "{0}";
break;
case 54:
msg = J.i18n.GT._ ("write what? {0} or {1} \"filename\"");
break;
}
if (msg.indexOf ("{0}") < 0) {
if (value != null) msg += ": " + value;
} else {
msg = J.util.TextFormat.simpleReplace (msg, "{0}", value);
if (msg.indexOf ("{1}") >= 0) msg = J.util.TextFormat.simpleReplace (msg, "{1}", more);
 else if (more != null) msg += ": " + more;
if (msg.indexOf ("{2}") >= 0) msg = J.util.TextFormat.simpleReplace (msg, "{2}", more);
}if (doTranslate) J.i18n.GT.setDoTranslate (true);
return msg;
}, "~N,~S,~S,~S,~B");
c$.setErrorLineMessage = $_M(c$, "setErrorLineMessage", 
function (functionName, filename, lineCurrent, pcCurrent, lineInfo) {
var err = "\n----";
if (filename != null || functionName != null) err += "line " + lineCurrent + " command " + (pcCurrent + 1) + " of " + (functionName == null ? filename : functionName.equals ("try") ? "try" : "function " + functionName) + ":";
err += "\n         " + lineInfo;
return err;
}, "~S,~S,~N,~N,~S");
$_M(c$, "toString", 
function () {
var str =  new J.util.SB ();
str.append ("Eval\n pc:");
str.appendI (this.pc);
str.append ("\n");
str.appendI (this.aatoken.length);
str.append (" statements\n");
for (var i = 0; i < this.aatoken.length; ++i) {
str.append ("----\n");
var atoken = this.aatoken[i];
for (var j = 0; j < atoken.length; ++j) {
str.appendO (atoken[j]);
str.appendC ('\n');
}
str.appendC ('\n');
}
str.append ("END\n");
return str.toString ();
});
c$.statementAsString = $_M(c$, "statementAsString", 
function (statement, iTok, doLogMessages) {
if (statement.length == 0) return "";
var sb =  new J.util.SB ();
var tok = statement[0].tok;
switch (tok) {
case 0:
return statement[0].value;
case 1150985:
if (statement.length == 2 && (statement[1].tok == 135368713 || statement[1].tok == 102436)) return ((statement[1].value)).toString ();
}
var useBraces = true;
var inBrace = false;
var inClauseDefine = false;
var setEquals = (statement.length > 1 && tok == 1085443 && statement[0].value.equals ("") && (statement[0].intValue == 61 || statement[0].intValue == 35) && statement[1].tok != 1048577);
var len = statement.length;
for (var i = 0; i < len; ++i) {
var token = statement[i];
if (token == null) {
len = i;
break;
}if (iTok == i - 1) sb.append (" <<");
if (i != 0) sb.appendC (' ');
if (i == 2 && setEquals) {
if ((setEquals = (token.tok != 269484436)) || statement[0].intValue == 35) {
sb.append (setEquals ? "= " : "== ");
if (!setEquals) continue;
}}if (iTok == i && token.tok != 1048578) sb.append (">> ");
switch (token.tok) {
case 1048577:
if (useBraces) sb.append ("{");
continue;
case 1048578:
if (inClauseDefine && i == statement.length - 1) useBraces = false;
if (useBraces) sb.append ("}");
continue;
case 269484096:
case 269484097:
break;
case 1048586:
case 1048590:
inBrace = (token.tok == 1048586);
break;
case 1060866:
if (i > 0 && (token.value).equals ("define")) {
sb.append ("@");
if (i + 1 < statement.length && statement[i + 1].tok == 1048577) {
if (!useBraces) inClauseDefine = true;
useBraces = true;
}continue;
}break;
case 1048589:
sb.append ("true");
continue;
case 1048588:
sb.append ("false");
continue;
case 135280132:
break;
case 2:
sb.appendI (token.intValue);
continue;
case 8:
case 9:
case 10:
sb.append (J.script.SV.sValue (token));
continue;
case 7:
case 6:
sb.append ((token).escape ());
continue;
case 5:
sb.appendC ('^');
continue;
case 1048615:
if (token.intValue != 2147483647) sb.appendI (token.intValue);
 else sb.append (J.modelset.Group.getSeqcodeStringFor (J.script.ScriptEvaluator.getSeqCode (token)));
token = statement[++i];
sb.appendC (' ');
sb.append (inBrace ? "-" : "- ");
case 1048614:
if (token.intValue != 2147483647) sb.appendI (token.intValue);
 else sb.append (J.modelset.Group.getSeqcodeStringFor (J.script.ScriptEvaluator.getSeqCode (token)));
continue;
case 1048609:
sb.append ("*:");
sb.appendC (String.fromCharCode (token.intValue));
continue;
case 1048607:
sb.append ("*%");
if (token.value != null) sb.append (token.value.toString ());
continue;
case 1048610:
sb.append ("*/");
case 1048611:
case 3:
if (token.intValue < 2147483647) {
sb.append (J.util.Escape.escapeModelFileNumber (token.intValue));
} else {
sb.append ("" + token.value);
}continue;
case 1048613:
sb.appendC ('[');
sb.append (J.modelset.Group.getGroup3For (token.intValue));
sb.appendC (']');
continue;
case 1048612:
sb.appendC ('[');
sb.appendO (token.value);
sb.appendC (']');
continue;
case 1048608:
sb.append ("*.");
break;
case 1095761925:
if (Clazz.instanceOf (token.value, J.util.P3)) {
var pt = token.value;
sb.append ("cell=").append (J.util.Escape.eP (pt));
continue;
}break;
case 4:
sb.append ("\"").appendO (token.value).append ("\"");
continue;
case 269484436:
case 269484434:
case 269484433:
case 269484432:
case 269484435:
case 269484438:
if (token.intValue == 1716520973) {
sb.append (statement[++i].value).append (" ");
} else if (token.intValue != 2147483647) sb.append (J.script.T.nameOf (token.intValue)).append (" ");
break;
case 364558:
continue;
case 1150985:
sb.append ("end");
continue;
default:
if (J.script.T.tokAttr (token.tok, 1073741824) || !doLogMessages) break;
sb.appendC ('\n').append (token.toString ()).appendC ('\n');
continue;
}
if (token.value != null) sb.append (token.value.toString ());
}
if (iTok >= len - 1 && iTok != 9999) sb.append (" <<");
return sb.toString ();
}, "~A,~N,~B");
$_M(c$, "getShapeProperty", 
($fz = function (shapeType, propertyName) {
return this.sm.getShapePropertyIndex (shapeType, propertyName, -2147483648);
}, $fz.isPrivate = true, $fz), "~N,~S");
$_M(c$, "getShapePropertyData", 
($fz = function (shapeType, propertyName, data) {
return this.sm.getShapePropertyData (shapeType, propertyName, data);
}, $fz.isPrivate = true, $fz), "~N,~S,~A");
$_M(c$, "getShapePropertyIndex", 
($fz = function (shapeType, propertyName, index) {
return this.sm.getShapePropertyIndex (shapeType, propertyName, index);
}, $fz.isPrivate = true, $fz), "~N,~S,~N");
$_M(c$, "addShapeProperty", 
($fz = function (propertyList, key, value) {
if (this.chk) return;
propertyList.addLast ([key, value]);
}, $fz.isPrivate = true, $fz), "J.util.JmolList,~S,~O");
$_M(c$, "setObjectMad", 
($fz = function (iShape, name, mad) {
if (this.chk) return;
this.viewer.setObjectMad (iShape, name, mad);
}, $fz.isPrivate = true, $fz), "~N,~S,~N");
$_M(c$, "setObjectArgb", 
($fz = function (str, argb) {
if (this.chk) return;
this.viewer.setObjectArgb (str, argb);
}, $fz.isPrivate = true, $fz), "~S,~N");
$_M(c$, "setShapeProperty", 
($fz = function (shapeType, propertyName, propertyValue) {
if (this.chk) return;
this.sm.setShapePropertyBs (shapeType, propertyName, propertyValue, null);
}, $fz.isPrivate = true, $fz), "~N,~S,~O");
$_M(c$, "setShapePropertyBs", 
($fz = function (iShape, propertyName, propertyValue, bs) {
if (this.chk) return;
this.sm.setShapePropertyBs (iShape, propertyName, propertyValue, bs);
}, $fz.isPrivate = true, $fz), "~N,~S,~O,J.util.BS");
$_M(c$, "setShapeSizeBs", 
($fz = function (shapeType, size, bs) {
if (this.chk) return;
this.sm.setShapeSizeBs (shapeType, size, null, bs);
}, $fz.isPrivate = true, $fz), "~N,~N,J.util.BS");
$_M(c$, "setShapeSize", 
($fz = function (shapeType, rd) {
if (this.chk) return;
this.sm.setShapeSizeBs (shapeType, 0, rd, null);
}, $fz.isPrivate = true, $fz), "~N,J.atomdata.RadiusData");
$_M(c$, "setBooleanProperty", 
($fz = function (key, value) {
if (!this.chk) this.viewer.setBooleanProperty (key, value);
}, $fz.isPrivate = true, $fz), "~S,~B");
$_M(c$, "setIntProperty", 
($fz = function (key, value) {
if (!this.chk) this.viewer.setIntProperty (key, value);
return true;
}, $fz.isPrivate = true, $fz), "~S,~N");
$_M(c$, "setFloatProperty", 
($fz = function (key, value) {
if (!this.chk) this.viewer.setFloatProperty (key, value);
return true;
}, $fz.isPrivate = true, $fz), "~S,~N");
$_M(c$, "setStringProperty", 
($fz = function (key, value) {
if (!this.chk) this.viewer.setStringProperty (key, value);
}, $fz.isPrivate = true, $fz), "~S,~S");
$_M(c$, "showString", 
($fz = function (str) {
this.showStringPrint (str, false);
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "showStringPrint", 
($fz = function (str, isPrint) {
if (this.chk || str == null) return;
if (this.outputBuffer != null) this.outputBuffer.append (str).appendC ('\n');
 else this.viewer.showString (str, isPrint);
}, $fz.isPrivate = true, $fz), "~S,~B");
$_M(c$, "scriptStatusOrBuffer", 
($fz = function (s) {
if (this.chk) return;
if (this.outputBuffer != null) {
this.outputBuffer.append (s).appendC ('\n');
return;
}this.viewer.scriptStatus (s);
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "atomExpressionAt", 
($fz = function (index) {
if (!this.checkToken (index)) this.errorAt (2, index);
return this.atomExpression (this.st, index, 0, true, false, true, true);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "atomExpression", 
($fz = function (code, pcStart, pcStop, allowRefresh, allowUnderflow, mustBeBitSet, andNotDeleted) {
this.isBondSet = false;
if (code !== this.st) {
this.tempStatement = this.st;
this.st = code;
}var rpn =  new J.script.ScriptMathProcessor (this, false, false, mustBeBitSet);
var val;
var comparisonValue = 2147483647;
var refreshed = false;
this.iToken = 1000;
var ignoreSubset = (pcStart < 0);
var isInMath = false;
var nExpress = 0;
var atomCount = this.viewer.getAtomCount ();
if (ignoreSubset) pcStart = -pcStart;
ignoreSubset = new Boolean (ignoreSubset | this.chk).valueOf ();
if (pcStop == 0 && code.length > pcStart) pcStop = pcStart + 1;
expression_loop : for (var pc = pcStart; pc < pcStop; ++pc) {
this.iToken = pc;
var instruction = code[pc];
if (instruction == null) break;
var value = instruction.value;
switch (instruction.tok) {
case 1048577:
pcStart = pc;
pcStop = code.length;
nExpress++;
break;
case 1048578:
nExpress--;
if (nExpress > 0) continue;
break expression_loop;
case 1048586:
if (this.isPoint3f (pc)) {
var pt = this.getPoint3f (pc, true);
if (pt != null) {
rpn.addXPt (pt);
pc = this.iToken;
break;
}}break;
case 1048590:
if (pc > 0 && code[pc - 1].tok == 1048586) rpn.addXBs ( new J.util.BS ());
break;
case 269484096:
isInMath = true;
rpn.addOp (instruction);
break;
case 269484097:
isInMath = false;
rpn.addOp (instruction);
break;
case 1060866:
rpn.addXBs (this.getAtomBitSet (value));
break;
case 135267841:
rpn.addXVar (J.script.SV.newScriptVariableToken (instruction));
rpn.addXVar (J.script.SV.newVariable (9, this.hklParameter (pc + 2)));
pc = this.iToken;
break;
case 135266319:
rpn.addXVar (J.script.SV.newScriptVariableToken (instruction));
rpn.addXVar (J.script.SV.newVariable (9, this.planeParameter (pc + 2)));
pc = this.iToken;
break;
case 1048582:
rpn.addXVar (J.script.SV.newScriptVariableToken (instruction));
rpn.addXPt (this.getPoint3f (pc + 2, true));
pc = this.iToken;
break;
case 4:
var s = value;
if (s.indexOf ("({") == 0) {
var bs = J.util.Escape.uB (s);
if (bs != null) {
rpn.addXBs (bs);
break;
}}rpn.addXVar (J.script.SV.newScriptVariableToken (instruction));
if (s.equals ("hkl")) {
rpn.addXVar (J.script.SV.newVariable (9, this.hklParameter (pc + 2)));
pc = this.iToken;
}break;
case 135267336:
case 135267335:
case 1238369286:
case 135266324:
case 135402505:
case 135266310:
case 269484080:
rpn.addOp (instruction);
break;
case 1048579:
rpn.addXBs (this.viewer.getModelUndeletedAtomsBitSet (-1));
break;
case 1048587:
rpn.addXBs ( new J.util.BS ());
break;
case 1048589:
case 1048588:
rpn.addXVar (J.script.SV.newScriptVariableToken (instruction));
break;
case 1114638350:
rpn.addXBs (J.util.BSUtil.copy (this.viewer.getSelectionSet (false)));
break;
case 3158024:
var bsSubset = this.viewer.getSelectionSubset ();
rpn.addXBs (bsSubset == null ? this.viewer.getModelUndeletedAtomsBitSet (-1) : J.util.BSUtil.copy (bsSubset));
break;
case 3145770:
rpn.addXBs (J.util.BSUtil.copy (this.viewer.getHiddenSet ()));
break;
case 1060869:
rpn.addXBs (J.util.BSUtil.copy (this.viewer.getMotionFixedAtoms ()));
break;
case 3145768:
rpn.addXBs (J.util.BSUtil.copyInvert (this.viewer.getHiddenSet (), atomCount));
break;
case 3145776:
rpn.addXBs (this.viewer.getBaseModelBitSet ());
break;
case 3145774:
if (!this.chk && !refreshed) this.viewer.setModelVisibility ();
refreshed = true;
rpn.addXBs (this.viewer.getVisibleSet ());
break;
case 3145766:
if (!this.chk && allowRefresh) this.refresh ();
rpn.addXBs (this.viewer.getClickableSet ());
break;
case 1048608:
if (this.viewer.allowSpecAtom ()) {
var atomID = instruction.intValue;
if (atomID > 0) rpn.addXBs (this.compareInt (1095761922, 269484436, atomID));
 else rpn.addXBs (this.getAtomBits (instruction.tok, value));
} else {
rpn.addXBs (this.lookupIdentifierValue ("_" + value));
}break;
case 3145764:
case 3145732:
case 1613758470:
case 1048585:
case 3145742:
case 3145744:
case 3145746:
case 3145748:
case 3145750:
case 1048612:
case 1048607:
case 3145772:
case 1089470478:
case 1614417948:
rpn.addXBs (this.getAtomBits (instruction.tok, value));
break;
case 1048610:
case 1048611:
var iModel = instruction.intValue;
if (iModel == 2147483647 && Clazz.instanceOf (value, Integer)) {
iModel = (value).intValue ();
if (!this.viewer.haveFileSet ()) {
rpn.addXBs (this.getAtomBits (1048610, Integer.$valueOf (iModel)));
break;
}if (iModel <= 2147) iModel = iModel * 1000000;
}rpn.addXBs (this.bitSetForModelFileNumber (iModel));
break;
case 1048613:
case 1048609:
rpn.addXBs (this.getAtomBits (instruction.tok, Integer.$valueOf (instruction.intValue)));
break;
case 1048614:
if (isInMath) rpn.addXNum (J.script.SV.newScriptVariableInt (instruction.intValue));
 else rpn.addXBs (this.getAtomBits (1048614, Integer.$valueOf (J.script.ScriptEvaluator.getSeqCode (instruction))));
break;
case 1048615:
if (isInMath) {
rpn.addXNum (J.script.SV.newScriptVariableInt (instruction.intValue));
rpn.addOp (J.script.T.tokenMinus);
rpn.addXNum (J.script.SV.newScriptVariableInt (code[++pc].intValue));
break;
}var chainID = (pc + 3 < code.length && code[pc + 2].tok == 269484160 && code[pc + 3].tok == 1048609 ? code[pc + 3].intValue : 9);
rpn.addXBs (this.getAtomBits (1048615, [J.script.ScriptEvaluator.getSeqCode (instruction), J.script.ScriptEvaluator.getSeqCode (code[++pc]), chainID]));
if (chainID != 9) pc += 2;
break;
case 1095761925:
var pt = value;
rpn.addXBs (this.getAtomBits (1095761925, [Clazz.doubleToInt (Math.floor (pt.x * 1000)), Clazz.doubleToInt (Math.floor (pt.y * 1000)), Clazz.doubleToInt (Math.floor (pt.z * 1000))]));
break;
case 3145758:
rpn.addXBs (this.viewer.getModelUndeletedAtomsBitSet (this.viewer.getCurrentModelIndex ()));
break;
case 1613758476:
case 3145730:
case 1115297793:
case 1613758488:
case 137363468:
case 3145735:
case 3145736:
case 3145738:
case 3145754:
case 3145756:
rpn.addXBs (this.lookupIdentifierValue (value));
break;
case 269484435:
case 269484434:
case 269484433:
case 269484432:
case 269484436:
case 269484438:
if (pc + 1 == code.length) this.error (22);
val = code[++pc].value;
var tokOperator = instruction.tok;
var tokWhat = instruction.intValue;
var property = (tokWhat == 1716520973 ? val : null);
if (property != null) {
if (pc + 1 == code.length) this.error (22);
val = code[++pc].value;
}if (tokWhat == 1095766022 && tokOperator != 269484436) this.error (22);
if (this.chk) {
rpn.addXBs ( new J.util.BS ());
break;
}var isModel = (tokWhat == 1095766028);
var isIntProperty = J.script.T.tokAttr (tokWhat, 1095761920);
var isFloatProperty = J.script.T.tokAttr (tokWhat, 1112539136);
var isIntOrFloat = isIntProperty && isFloatProperty;
var isStringProperty = !isIntProperty && J.script.T.tokAttr (tokWhat, 1087373312);
if (tokWhat == 1087375365) isIntProperty = !(isStringProperty = false);
var tokValue = code[pc].tok;
comparisonValue = code[pc].intValue;
var comparisonFloat = NaN;
if (Clazz.instanceOf (val, J.util.P3)) {
if (tokWhat == 1766856708) {
comparisonValue = J.util.ColorUtil.colorPtToInt (val);
tokValue = 2;
isIntProperty = true;
}} else if (Clazz.instanceOf (val, String)) {
if (tokWhat == 1766856708) {
comparisonValue = J.util.ColorUtil.getArgbFromString (val);
if (comparisonValue == 0 && J.script.T.tokAttr (tokValue, 1073741824)) {
val = this.getStringParameter (val, true);
if ((val).startsWith ("{")) {
val = J.util.Escape.uP (val);
if (Clazz.instanceOf (val, J.util.P3)) comparisonValue = J.util.ColorUtil.colorPtToInt (val);
 else comparisonValue = 0;
} else {
comparisonValue = J.util.ColorUtil.getArgbFromString (val);
}}tokValue = 2;
isIntProperty = true;
} else if (isStringProperty) {
if (J.script.T.tokAttr (tokValue, 1073741824)) val = this.getStringParameter (val, true);
} else {
if (J.script.T.tokAttr (tokValue, 1073741824)) val = this.getNumericParameter (val);
if (Clazz.instanceOf (val, String)) {
if (tokWhat == 1641025539 || tokWhat == 1238369286 || tokWhat == 1087375365) isStringProperty = !(isIntProperty = (comparisonValue != 2147483647));
 else val = J.script.SV.nValue (code[pc]);
}if (Clazz.instanceOf (val, Integer)) comparisonFloat = comparisonValue = (val).intValue ();
 else if (Clazz.instanceOf (val, Float) && isModel) comparisonValue = J.modelset.ModelCollection.modelFileNumberFromFloat ((val).floatValue ());
}}if (isStringProperty && !(Clazz.instanceOf (val, String))) {
val = "" + val;
}if (Clazz.instanceOf (val, Integer) || tokValue == 2) {
if (isModel) {
if (comparisonValue >= 1000000) tokWhat = -1095766028;
} else if (isIntOrFloat) {
isFloatProperty = false;
} else if (isFloatProperty) {
comparisonFloat = comparisonValue;
}} else if (Clazz.instanceOf (val, Float)) {
if (isModel) {
tokWhat = -1095766028;
} else {
comparisonFloat = (val).floatValue ();
if (isIntOrFloat) {
isIntProperty = false;
} else if (isIntProperty) {
comparisonValue = Clazz.floatToInt (comparisonFloat);
}}} else if (!isStringProperty) {
this.iToken++;
this.error (22);
}if (isModel && comparisonValue >= 1000000 && comparisonValue % 1000000 == 0) {
comparisonValue /= 1000000;
tokWhat = 1229984263;
isModel = false;
}if (tokWhat == -1095766028 && tokOperator == 269484436) {
rpn.addXBs (this.bitSetForModelFileNumber (comparisonValue));
break;
}if (value != null && (value).indexOf ("-") >= 0) {
if (isIntProperty) comparisonValue = -comparisonValue;
 else if (!Float.isNaN (comparisonFloat)) comparisonFloat = -comparisonFloat;
}var data = (tokWhat == 1716520973 ? this.viewer.getDataFloat (property) : null);
rpn.addXBs (isIntProperty ? this.compareInt (tokWhat, tokOperator, comparisonValue) : isStringProperty ? this.compareString (tokWhat, tokOperator, val) : this.compareFloatData (tokWhat, data, tokOperator, comparisonFloat));
break;
case 3:
case 2:
rpn.addXNum (J.script.SV.newScriptVariableToken (instruction));
break;
case 10:
var bs1 = J.util.BSUtil.copy (value);
rpn.addXBs (bs1);
break;
case 8:
rpn.addXPt (value);
break;
default:
if (J.script.T.tokAttr (instruction.tok, 269484032)) {
if (!rpn.addOp (instruction)) this.error (22);
break;
}if (!(Clazz.instanceOf (value, String))) {
rpn.addXObj (value);
break;
}val = this.getParameter (value, 0);
if (isInMath) {
rpn.addXObj (val);
break;
}if (Clazz.instanceOf (val, String)) val = this.getStringObjectAsVariable (val, null);
if (Clazz.instanceOf (val, J.util.JmolList)) {
var bs = J.script.SV.unEscapeBitSetArray (val, true);
if (bs == null) val = value;
 else val = bs;
}if (Clazz.instanceOf (val, String)) val = this.lookupIdentifierValue (value);
rpn.addXObj (val);
break;
}
}
this.expressionResult = rpn.getResult (allowUnderflow);
if (this.expressionResult == null) {
if (allowUnderflow) return null;
if (!this.chk) rpn.dumpStacks ("after getResult");
this.error (13);
}this.expressionResult = (this.expressionResult).value;
if (Clazz.instanceOf (this.expressionResult, String) && (mustBeBitSet || (this.expressionResult).startsWith ("({"))) {
this.expressionResult = (this.chk ?  new J.util.BS () : this.getAtomBitSet (this.expressionResult));
}if (!mustBeBitSet && !(Clazz.instanceOf (this.expressionResult, J.util.BS))) return null;
var bs = (Clazz.instanceOf (this.expressionResult, J.util.BS) ? this.expressionResult :  new J.util.BS ());
this.isBondSet = (Clazz.instanceOf (this.expressionResult, J.modelset.Bond.BondSet));
if (!this.isBondSet) {
this.viewer.excludeAtoms (bs, ignoreSubset);
if (bs.length () > this.viewer.getAtomCount ()) bs.clearAll ();
}if (this.tempStatement != null) {
this.st = this.tempStatement;
this.tempStatement = null;
}return bs;
}, $fz.isPrivate = true, $fz), "~A,~N,~N,~B,~B,~B,~B");
$_M(c$, "compareFloatData", 
($fz = function (tokWhat, data, tokOperator, comparisonFloat) {
var bs =  new J.util.BS ();
var atomCount = this.viewer.getAtomCount ();
var modelSet = this.viewer.modelSet;
var atoms = modelSet.atoms;
var propertyFloat = 0;
this.viewer.autoCalculate (tokWhat);
for (var i = atomCount; --i >= 0; ) {
var match = false;
var atom = atoms[i];
switch (tokWhat) {
default:
propertyFloat = J.modelset.Atom.atomPropertyFloat (this.viewer, atom, tokWhat);
break;
case 1716520973:
if (data == null || data.length <= i) continue;
propertyFloat = data[i];
}
match = J.script.ScriptEvaluator.compareFloat (tokOperator, propertyFloat, comparisonFloat);
if (match) bs.set (i);
}
return bs;
}, $fz.isPrivate = true, $fz), "~N,~A,~N,~N");
$_M(c$, "compareString", 
($fz = function (tokWhat, tokOperator, comparisonString) {
var bs =  new J.util.BS ();
var atoms = this.viewer.modelSet.atoms;
var atomCount = this.viewer.getAtomCount ();
var isCaseSensitive = (tokWhat == 1087373316 && this.viewer.getBoolean (603979822));
if (!isCaseSensitive) comparisonString = comparisonString.toLowerCase ();
for (var i = atomCount; --i >= 0; ) {
var propertyString = J.modelset.Atom.atomPropertyString (this.viewer, atoms[i], tokWhat);
if (!isCaseSensitive) propertyString = propertyString.toLowerCase ();
if (this.compareStringValues (tokOperator, propertyString, comparisonString)) bs.set (i);
}
return bs;
}, $fz.isPrivate = true, $fz), "~N,~N,~S");
$_M(c$, "compareInt", 
function (tokWhat, tokOperator, comparisonValue) {
var propertyValue = 2147483647;
var propertyBitSet = null;
var bitsetComparator = tokOperator;
var bitsetBaseValue = comparisonValue;
var atomCount = this.viewer.getAtomCount ();
var modelSet = this.viewer.modelSet;
var atoms = modelSet.atoms;
var imax = -1;
var imin = 0;
var iModel = -1;
var cellRange = null;
var nOps = 0;
var bs;
switch (tokWhat) {
case 1297090050:
switch (bitsetComparator) {
case 269484433:
case 269484432:
imax = 2147483647;
break;
}
break;
case 1095761923:
try {
switch (tokOperator) {
case 269484435:
return J.util.BSUtil.newBitSet2 (0, comparisonValue);
case 269484434:
return J.util.BSUtil.newBitSet2 (0, comparisonValue + 1);
case 269484433:
return J.util.BSUtil.newBitSet2 (comparisonValue, atomCount);
case 269484432:
return J.util.BSUtil.newBitSet2 (comparisonValue + 1, atomCount);
case 269484436:
return (comparisonValue < atomCount ? J.util.BSUtil.newBitSet2 (comparisonValue, comparisonValue + 1) :  new J.util.BS ());
case 269484438:
default:
bs = J.util.BSUtil.setAll (atomCount);
if (comparisonValue >= 0) bs.clear (comparisonValue);
return bs;
}
} catch (e) {
if (Clazz.exceptionOf (e, Exception)) {
return  new J.util.BS ();
} else {
throw e;
}
}
}
bs = J.util.BSUtil.newBitSet (atomCount);
for (var i = 0; i < atomCount; ++i) {
var match = false;
var atom = atoms[i];
switch (tokWhat) {
default:
propertyValue = J.modelset.Atom.atomPropertyInt (atom, tokWhat);
break;
case 1095766022:
return J.util.BSUtil.copy (this.viewer.getConformation (-1, comparisonValue - 1, false));
case 1297090050:
propertyBitSet = atom.getAtomSymmetry ();
if (propertyBitSet == null) continue;
if (atom.getModelIndex () != iModel) {
iModel = atom.getModelIndex ();
cellRange = modelSet.getModelCellRange (iModel);
nOps = modelSet.getModelSymmetryCount (iModel);
}if (bitsetBaseValue >= 200) {
if (cellRange == null) continue;
comparisonValue = bitsetBaseValue % 1000;
var symop = Clazz.doubleToInt (bitsetBaseValue / 1000) - 1;
if (symop < 0) {
match = true;
} else if (nOps == 0 || symop >= 0 && !(match = propertyBitSet.get (symop))) {
continue;
}bitsetComparator = 1048587;
if (symop < 0) propertyValue = atom.getCellTranslation (comparisonValue, cellRange, nOps);
 else propertyValue = atom.getSymmetryTranslation (symop, cellRange, nOps);
} else if (nOps > 0) {
if (comparisonValue > nOps) {
if (bitsetComparator != 269484435 && bitsetComparator != 269484434) continue;
}if (bitsetComparator == 269484438) {
if (comparisonValue > 0 && comparisonValue <= nOps && !propertyBitSet.get (comparisonValue)) {
bs.set (i);
}continue;
}}switch (bitsetComparator) {
case 269484435:
imax = comparisonValue - 1;
break;
case 269484434:
imax = comparisonValue;
break;
case 269484433:
imin = comparisonValue - 1;
break;
case 269484432:
imin = comparisonValue;
break;
case 269484436:
imax = comparisonValue;
imin = comparisonValue - 1;
break;
case 269484438:
match = !propertyBitSet.get (comparisonValue);
break;
}
if (imin < 0) imin = 0;
if (imin < imax) {
var pt = propertyBitSet.nextSetBit (imin);
if (pt >= 0 && pt < imax) match = true;
}if (!match || propertyValue == 2147483647) tokOperator = 1048587;
}
switch (tokOperator) {
case 1048587:
break;
case 269484435:
match = (propertyValue < comparisonValue);
break;
case 269484434:
match = (propertyValue <= comparisonValue);
break;
case 269484433:
match = (propertyValue >= comparisonValue);
break;
case 269484432:
match = (propertyValue > comparisonValue);
break;
case 269484436:
match = (propertyValue == comparisonValue);
break;
case 269484438:
match = (propertyValue != comparisonValue);
break;
}
if (match) bs.set (i);
}
return bs;
}, "~N,~N,~N");
$_M(c$, "compareStringValues", 
($fz = function (tokOperator, propertyValue, comparisonValue) {
switch (tokOperator) {
case 269484436:
case 269484438:
return (J.util.TextFormat.isMatch (propertyValue, comparisonValue, true, true) == (tokOperator == 269484436));
default:
this.error (22);
}
return false;
}, $fz.isPrivate = true, $fz), "~N,~S,~S");
c$.compareFloat = $_M(c$, "compareFloat", 
($fz = function (tokOperator, propertyFloat, comparisonFloat) {
switch (tokOperator) {
case 269484435:
return propertyFloat < comparisonFloat;
case 269484434:
return propertyFloat <= comparisonFloat;
case 269484433:
return propertyFloat >= comparisonFloat;
case 269484432:
return propertyFloat > comparisonFloat;
case 269484436:
return propertyFloat == comparisonFloat;
case 269484438:
return propertyFloat != comparisonFloat;
}
return false;
}, $fz.isPrivate = true, $fz), "~N,~N,~N");
$_M(c$, "getAtomBits", 
($fz = function (tokType, specInfo) {
return (this.chk ?  new J.util.BS () : this.viewer.getAtomBits (tokType, specInfo));
}, $fz.isPrivate = true, $fz), "~N,~O");
c$.getSeqCode = $_M(c$, "getSeqCode", 
($fz = function (instruction) {
return (instruction.intValue != 2147483647 ? J.modelset.Group.getSeqcodeFor (instruction.intValue, ' ') : (instruction.value).intValue ());
}, $fz.isPrivate = true, $fz), "J.script.T");
$_M(c$, "checkLast", 
($fz = function (i) {
return this.checkLength (i + 1) - 1;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "checkLength", 
($fz = function (length) {
if (length >= 0) return this.checkLengthErrorPt (length, 0);
if (this.slen > -length) {
this.iToken = -length;
this.error (2);
}return this.slen;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "checkLengthErrorPt", 
($fz = function (length, errorPt) {
if (this.slen != length) {
this.iToken = errorPt > 0 ? errorPt : this.slen;
this.error (errorPt > 0 ? 22 : 2);
}return this.slen;
}, $fz.isPrivate = true, $fz), "~N,~N");
$_M(c$, "checkLength23", 
($fz = function () {
this.iToken = this.slen;
if (this.slen != 2 && this.slen != 3) this.error (2);
return this.slen;
}, $fz.isPrivate = true, $fz));
$_M(c$, "checkLength34", 
($fz = function () {
this.iToken = this.slen;
if (this.slen != 3 && this.slen != 4) this.error (2);
return this.slen;
}, $fz.isPrivate = true, $fz));
$_M(c$, "getToken", 
($fz = function (i) {
if (!this.checkToken (i)) this.error (13);
this.theToken = this.st[i];
this.theTok = this.theToken.tok;
return this.theToken;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "tokAt", 
($fz = function (i) {
return (i < this.slen && this.st[i] != null ? this.st[i].tok : 0);
}, $fz.isPrivate = true, $fz), "~N");
c$.tokAtArray = $_M(c$, "tokAtArray", 
($fz = function (i, args) {
return (i < args.length && args[i] != null ? args[i].tok : 0);
}, $fz.isPrivate = true, $fz), "~N,~A");
$_M(c$, "tokenAt", 
($fz = function (i, args) {
return (i < args.length ? args[i] : null);
}, $fz.isPrivate = true, $fz), "~N,~A");
$_M(c$, "checkToken", 
($fz = function (i) {
return (this.iToken = i) < this.slen;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "modelNumberParameter", 
($fz = function (index) {
var iFrame = 0;
var useModelNumber = false;
switch (this.tokAt (index)) {
case 2:
useModelNumber = true;
case 3:
iFrame = this.getToken (index).intValue;
break;
case 4:
iFrame = J.script.ScriptEvaluator.getFloatEncodedInt (this.stringParameter (index));
break;
default:
this.error (22);
}
return this.viewer.getModelNumberIndex (iFrame, useModelNumber, true);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "optParameterAsString", 
($fz = function (i) {
if (i >= this.slen) return "";
return this.parameterAsString (i);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "parameterAsString", 
($fz = function (i) {
this.getToken (i);
if (this.theToken == null) this.error (13);
return J.script.SV.sValue (this.theToken);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "intParameter", 
($fz = function (index) {
if (this.checkToken (index)) if (this.getToken (index).tok == 2) return this.theToken.intValue;
this.error (20);
return 0;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "intParameterRange", 
($fz = function (i, min, max) {
var val = this.intParameter (i);
if (val < min || val > max) this.integerOutOfRange (min, max);
return val;
}, $fz.isPrivate = true, $fz), "~N,~N,~N");
$_M(c$, "isFloatParameter", 
($fz = function (index) {
switch (this.tokAt (index)) {
case 2:
case 3:
return true;
}
return false;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "floatParameterRange", 
($fz = function (i, min, max) {
var val = this.floatParameter (i);
if (val < min || val > max) this.numberOutOfRange (min, max);
return val;
}, $fz.isPrivate = true, $fz), "~N,~N,~N");
$_M(c$, "floatParameter", 
($fz = function (index) {
if (this.checkToken (index)) {
this.getToken (index);
switch (this.theTok) {
case 1048615:
return -this.theToken.intValue;
case 1048614:
case 2:
return this.theToken.intValue;
case 1048611:
case 3:
return (this.theToken.value).floatValue ();
}
}this.error (34);
return 0;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "floatParameterSet", 
($fz = function (i, nMin, nMax) {
var tok = this.tokAt (i);
if (tok == 1073742195) tok = this.tokAt (++i);
var haveBrace = (tok == 1048586);
var haveSquare = (tok == 269484096);
var fparams = null;
var v =  new J.util.JmolList ();
var n = 0;
if (haveBrace || haveSquare) i++;
var pt;
var s = null;
switch (this.tokAt (i)) {
case 4:
s = J.script.SV.sValue (this.st[i]);
s = J.util.TextFormat.replaceAllCharacter (s, "{},[]\"'", ' ');
fparams = J.util.Parser.parseFloatArray (s);
n = fparams.length;
break;
case 7:
fparams = J.script.SV.flistValue (this.st[i++], 0);
n = fparams.length;
break;
default:
while (n < nMax) {
tok = this.tokAt (i);
if (haveBrace && tok == 1048590 || haveSquare && tok == 269484097) break;
switch (tok) {
case 269484080:
case 1048586:
case 1048590:
break;
case 4:
break;
case 8:
pt = this.getPoint3f (i, false);
v.addLast (Float.$valueOf (pt.x));
v.addLast (Float.$valueOf (pt.y));
v.addLast (Float.$valueOf (pt.z));
n += 3;
break;
case 9:
var pt4 = this.getPoint4f (i);
v.addLast (Float.$valueOf (pt4.x));
v.addLast (Float.$valueOf (pt4.y));
v.addLast (Float.$valueOf (pt4.z));
v.addLast (Float.$valueOf (pt4.w));
n += 4;
break;
default:
v.addLast (Float.$valueOf (this.floatParameter (i)));
n++;
if (n == nMax && haveSquare && this.tokAt (i + 1) == 1048590) i++;
}
i++;
}
}
if (haveBrace && this.tokAt (i++) != 1048590 || haveSquare && this.tokAt (i++) != 269484097) this.error (22);
this.iToken = i - 1;
if (n < nMin || n > nMax) this.error (22);
if (fparams == null) {
fparams =  Clazz.newFloatArray (n, 0);
for (var j = 0; j < n; j++) fparams[j] = v.get (j).floatValue ();

}return fparams;
}, $fz.isPrivate = true, $fz), "~N,~N,~N");
$_M(c$, "isArrayParameter", 
($fz = function (i) {
switch (this.tokAt (i)) {
case 7:
case 11:
case 12:
case 1073742195:
case 269484096:
return true;
}
return false;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "getPointArray", 
($fz = function (i, nPoints) {
var points = (nPoints < 0 ? null :  new Array (nPoints));
var vp = (nPoints < 0 ?  new J.util.JmolList () : null);
var tok = (i < 0 ? 7 : this.getToken (i++).tok);
switch (tok) {
case 7:
var v = (this.theToken).getList ();
if (nPoints >= 0 && v.size () != nPoints) this.error (22);
nPoints = v.size ();
if (points == null) points =  new Array (nPoints);
for (var j = 0; j < nPoints; j++) if ((points[j] = J.script.SV.ptValue (v.get (j))) == null) this.error (22);

return points;
case 1073742195:
tok = this.tokAt (i++);
break;
}
if (tok != 269484096) this.error (22);
var n = 0;
while (tok != 269484097 && tok != 0) {
tok = this.getToken (i).tok;
switch (tok) {
case 0:
case 269484097:
break;
case 269484080:
i++;
break;
default:
if (nPoints >= 0 && n == nPoints) {
tok = 0;
break;
}var pt = this.getPoint3f (i, true);
if (points == null) vp.addLast (pt);
 else points[n] = pt;
n++;
i = this.iToken + 1;
}
}
if (tok != 269484097) this.error (22);
if (points == null) points = vp.toArray ( new Array (vp.size ()));
return points;
}, $fz.isPrivate = true, $fz), "~N,~N");
$_M(c$, "floatArraySet", 
($fz = function (i, nX, nY) {
var tok = this.tokAt (i++);
if (tok == 1073742195) tok = this.tokAt (i++);
if (tok != 269484096) this.error (22);
var fparams = J.util.ArrayUtil.newFloat2 (nX);
var n = 0;
while (tok != 269484097) {
tok = this.getToken (i).tok;
switch (tok) {
case 1073742195:
case 269484097:
continue;
case 269484080:
i++;
break;
case 269484096:
i++;
var f =  Clazz.newFloatArray (nY, 0);
fparams[n++] = f;
for (var j = 0; j < nY; j++) {
f[j] = this.floatParameter (i++);
if (this.tokAt (i) == 269484080) i++;
}
if (this.tokAt (i++) != 269484097) this.error (22);
tok = 0;
if (n == nX && this.tokAt (i) != 269484097) this.error (22);
break;
default:
this.error (22);
}
}
return fparams;
}, $fz.isPrivate = true, $fz), "~N,~N,~N");
$_M(c$, "floatArraySetXYZ", 
($fz = function (i, nX, nY, nZ) {
var tok = this.tokAt (i++);
if (tok == 1073742195) tok = this.tokAt (i++);
if (tok != 269484096 || nX <= 0) this.error (22);
var fparams = J.util.ArrayUtil.newFloat3 (nX, -1);
var n = 0;
while (tok != 269484097) {
tok = this.getToken (i).tok;
switch (tok) {
case 1073742195:
case 269484097:
continue;
case 269484080:
i++;
break;
case 269484096:
fparams[n++] = this.floatArraySet (i, nY, nZ);
i = ++this.iToken;
tok = 0;
if (n == nX && this.tokAt (i) != 269484097) this.error (22);
break;
default:
this.error (22);
}
}
return fparams;
}, $fz.isPrivate = true, $fz), "~N,~N,~N,~N");
$_M(c$, "stringParameter", 
($fz = function (index) {
if (!this.checkToken (index) || this.getToken (index).tok != 4) this.error (41);
return this.theToken.value;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "stringParameterSet", 
($fz = function (i) {
switch (this.tokAt (i)) {
case 4:
var s = this.stringParameter (i);
if (s.startsWith ("[\"")) {
var o = this.viewer.evaluateExpression (s);
if (Clazz.instanceOf (o, String)) return J.util.TextFormat.split (o, '\n');
}return [s];
case 1073742195:
i += 2;
break;
case 269484096:
++i;
break;
case 7:
return J.script.SV.listValue (this.getToken (i));
default:
this.error (22);
}
var tok;
var v =  new J.util.JmolList ();
while ((tok = this.tokAt (i)) != 269484097) {
switch (tok) {
case 269484080:
break;
case 4:
v.addLast (this.stringParameter (i));
break;
default:
case 0:
this.error (22);
}
i++;
}
this.iToken = i;
var n = v.size ();
var sParams =  new Array (n);
for (var j = 0; j < n; j++) {
sParams[j] = v.get (j);
}
return sParams;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "objectNameParameter", 
($fz = function (index) {
if (!this.checkToken (index)) this.error (37);
return this.parameterAsString (index);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "booleanParameter", 
($fz = function (i) {
if (this.slen == i) return true;
switch (this.getToken (this.checkLast (i)).tok) {
case 1048589:
return true;
case 1048588:
return false;
default:
this.error (5);
}
return false;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "atomCenterOrCoordinateParameter", 
($fz = function (i) {
switch (this.getToken (i).tok) {
case 10:
case 1048577:
var bs = this.atomExpression (this.st, i, 0, true, false, false, true);
if (bs != null) return this.viewer.getAtomSetCenter (bs);
if (Clazz.instanceOf (this.expressionResult, J.util.P3)) return this.expressionResult;
this.error (22);
break;
case 1048586:
case 8:
return this.getPoint3f (i, true);
}
this.error (22);
return null;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "isCenterParameter", 
($fz = function (i) {
var tok = this.tokAt (i);
return (tok == 1048583 || tok == 1048586 || tok == 1048577 || tok == 8 || tok == 10);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "centerParameter", 
($fz = function (i) {
return this.centerParameterForModel (i, -2147483648);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "centerParameterForModel", 
($fz = function (i, modelIndex) {
var center = null;
this.expressionResult = null;
if (this.checkToken (i)) {
switch (this.getToken (i).tok) {
case 1048583:
var id = this.objectNameParameter (++i);
var index = -2147483648;
if (this.tokAt (i + 1) == 269484096) {
index = this.parameterExpressionList (-i - 1, -1, true).get (0).asInt ();
if (this.getToken (--this.iToken).tok != 269484097) this.error (22);
}if (this.chk) return  new J.util.P3 ();
if (this.tokAt (i + 1) == 1048584 && (this.tokAt (i + 2) == 1141899267 || this.tokAt (i + 2) == 1141899270)) {
index = 2147483647;
this.iToken = i + 2;
}if ((center = this.getObjectCenter (id, index, modelIndex)) == null) this.errorStr (12, id);
break;
case 10:
case 1048577:
case 1048586:
case 8:
center = this.atomCenterOrCoordinateParameter (i);
break;
}
}if (center == null) this.error (11);
return center;
}, $fz.isPrivate = true, $fz), "~N,~N");
$_M(c$, "planeParameter", 
($fz = function (i) {
var vAB =  new J.util.V3 ();
var vAC =  new J.util.V3 ();
var plane = null;
var isNegated = (this.tokAt (i) == 269484192);
if (isNegated) i++;
if (i < this.slen) switch (this.getToken (i).tok) {
case 9:
plane = J.util.P4.newPt (this.theToken.value);
break;
case 1048583:
var id = this.objectNameParameter (++i);
if (this.chk) return  new J.util.P4 ();
var shapeType = this.sm.getShapeIdFromObjectName (id);
switch (shapeType) {
case 22:
this.setShapeProperty (22, "thisID", id);
var points = this.getShapeProperty (22, "vertices");
if (points == null || points.length < 3 || points[0] == null || points[1] == null || points[2] == null) break;
J.util.Measure.getPlaneThroughPoints (points[0], points[1], points[2],  new J.util.V3 (), vAB, vAC, plane =  new J.util.P4 ());
break;
case 24:
this.setShapeProperty (24, "thisID", id);
plane = this.getShapeProperty (24, "plane");
break;
}
break;
case 1112541205:
if (!this.checkToken (++i) || this.getToken (i++).tok != 269484436) this.evalError ("x=?", null);
plane = J.util.P4.new4 (1, 0, 0, -this.floatParameter (i));
break;
case 1112541206:
if (!this.checkToken (++i) || this.getToken (i++).tok != 269484436) this.evalError ("y=?", null);
plane = J.util.P4.new4 (0, 1, 0, -this.floatParameter (i));
break;
case 1112541207:
if (!this.checkToken (++i) || this.getToken (i++).tok != 269484436) this.evalError ("z=?", null);
plane = J.util.P4.new4 (0, 0, 1, -this.floatParameter (i));
break;
case 1073741824:
case 4:
var str = this.parameterAsString (i);
if (str.equalsIgnoreCase ("xy")) return J.util.P4.new4 (0, 0, 1, 0);
if (str.equalsIgnoreCase ("xz")) return J.util.P4.new4 (0, 1, 0, 0);
if (str.equalsIgnoreCase ("yz")) return J.util.P4.new4 (1, 0, 0, 0);
this.iToken += 2;
break;
case 1048586:
if (!this.isPoint3f (i)) {
plane = this.getPoint4f (i);
break;
}case 10:
case 1048577:
var pt1 = this.atomCenterOrCoordinateParameter (i);
if (this.getToken (++this.iToken).tok == 269484080) ++this.iToken;
var pt2 = this.atomCenterOrCoordinateParameter (this.iToken);
if (this.getToken (++this.iToken).tok == 269484080) ++this.iToken;
var pt3 = this.atomCenterOrCoordinateParameter (this.iToken);
i = this.iToken;
var norm =  new J.util.V3 ();
var w = J.util.Measure.getNormalThroughPoints (pt1, pt2, pt3, norm, vAB, vAC);
plane =  new J.util.P4 ();
plane.set (norm.x, norm.y, norm.z, w);
if (!this.chk && J.util.Logger.debugging) J.util.Logger.debug ("points: " + pt1 + pt2 + pt3 + " defined plane: " + plane);
break;
}
if (plane == null) this.planeExpected ();
if (isNegated) {
plane.scale (-1);
}return plane;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "hklParameter", 
($fz = function (i) {
if (!this.chk && this.viewer.getCurrentUnitCell () == null) this.error (33);
var pt = this.getPointOrPlane (i, false, true, false, true, 3, 3);
var p = this.getHklPlane (pt);
if (p == null) this.error (3);
if (!this.chk && J.util.Logger.debugging) J.util.Logger.info ("defined plane: " + p);
return p;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "getHklPlane", 
function (pt) {
var vAB =  new J.util.V3 ();
var vAC =  new J.util.V3 ();
var pt1 = J.util.P3.new3 (pt.x == 0 ? 1 : 1 / pt.x, 0, 0);
var pt2 = J.util.P3.new3 (0, pt.y == 0 ? 1 : 1 / pt.y, 0);
var pt3 = J.util.P3.new3 (0, 0, pt.z == 0 ? 1 : 1 / pt.z);
if (pt.x == 0 && pt.y == 0 && pt.z == 0) {
return null;
} else if (pt.x == 0 && pt.y == 0) {
pt1.set (1, 0, pt3.z);
pt2.set (0, 1, pt3.z);
} else if (pt.y == 0 && pt.z == 0) {
pt2.set (pt1.x, 0, 1);
pt3.set (pt1.x, 1, 0);
} else if (pt.z == 0 && pt.x == 0) {
pt3.set (0, pt2.y, 1);
pt1.set (1, pt2.y, 0);
} else if (pt.x == 0) {
pt1.set (1, pt2.y, 0);
} else if (pt.y == 0) {
pt2.set (0, 1, pt3.z);
} else if (pt.z == 0) {
pt3.set (pt1.x, 0, 1);
}this.viewer.toCartesian (pt1, false);
this.viewer.toCartesian (pt2, false);
this.viewer.toCartesian (pt3, false);
var plane =  new J.util.V3 ();
var w = J.util.Measure.getNormalThroughPoints (pt1, pt2, pt3, plane, vAB, vAC);
var pt4 =  new J.util.P4 ();
pt4.set (plane.x, plane.y, plane.z, w);
return pt4;
}, "J.util.P3");
$_M(c$, "getMadParameter", 
($fz = function () {
var mad = 1;
switch (this.getToken (1).tok) {
case 1073742072:
this.restrictSelected (false, false);
break;
case 1048589:
break;
case 1048588:
mad = 0;
break;
case 2:
var radiusRasMol = this.intParameterRange (1, 0, 750);
mad = radiusRasMol * 4 * 2;
break;
case 3:
mad = Clazz.doubleToInt (Math.floor (this.floatParameterRange (1, -3, 3) * 1000 * 2));
if (mad < 0) {
this.restrictSelected (false, false);
mad = -mad;
}break;
default:
this.error (6);
}
return mad;
}, $fz.isPrivate = true, $fz));
$_M(c$, "getSetAxesTypeMad", 
($fz = function (index) {
if (index == this.slen) return 1;
switch (this.getToken (this.checkLast (index)).tok) {
case 1048589:
return 1;
case 1048588:
return 0;
case 1073741926:
return -1;
case 2:
return this.intParameterRange (index, -1, 19);
case 3:
var angstroms = this.floatParameterRange (index, 0, 2);
return Clazz.doubleToInt (Math.floor (angstroms * 1000 * 2));
}
this.errorStr (7, "\"DOTTED\"");
return 0;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "isColorParam", 
($fz = function (i) {
var tok = this.tokAt (i);
return (tok == 570425378 || tok == 1073742195 || tok == 269484096 || tok == 7 || tok == 8 || this.isPoint3f (i) || (tok == 4 || J.script.T.tokAttr (tok, 1073741824)) && J.util.ColorUtil.getArgbFromString (this.st[i].value) != 0);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "getArgbParam", 
($fz = function (index) {
return this.getArgbParamOrNone (index, false);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "getArgbParamLast", 
($fz = function (index, allowNone) {
var icolor = this.getArgbParamOrNone (index, allowNone);
this.checkLast (this.iToken);
return icolor;
}, $fz.isPrivate = true, $fz), "~N,~B");
$_M(c$, "getArgbParamOrNone", 
($fz = function (index, allowNone) {
var pt = null;
if (this.checkToken (index)) {
switch (this.getToken (index).tok) {
default:
if (!J.script.T.tokAttr (this.theTok, 1073741824)) break;
case 570425378:
case 4:
return J.util.ColorUtil.getArgbFromString (this.parameterAsString (index));
case 1073742195:
return this.getColorTriad (index + 2);
case 269484096:
return this.getColorTriad (++index);
case 7:
var rgb = J.script.SV.flistValue (this.theToken, 3);
if (rgb != null && rgb.length != 3) pt = J.util.P3.new3 (rgb[0], rgb[1], rgb[2]);
break;
case 8:
pt = this.theToken.value;
break;
case 1048586:
pt = this.getPoint3f (index, false);
break;
case 1048587:
if (allowNone) return 0;
}
}if (pt == null) this.error (8);
return J.util.ColorUtil.colorPtToInt (pt);
}, $fz.isPrivate = true, $fz), "~N,~B");
$_M(c$, "getColorTriad", 
($fz = function (i) {
var colors =  Clazz.newFloatArray (3, 0);
var n = 0;
var hex = "";
this.getToken (i);
var pt = null;
var val = 0;
out : switch (this.theTok) {
case 2:
case 1048614:
case 3:
for (; i < this.slen; i++) {
switch (this.getToken (i).tok) {
case 269484080:
continue;
case 1073741824:
if (n != 1 || colors[0] != 0) this.error (4);
hex = "0" + this.parameterAsString (i);
break out;
case 3:
if (n > 2) this.error (4);
val = this.floatParameter (i);
break;
case 2:
if (n > 2) this.error (4);
val = this.theToken.intValue;
break;
case 1048614:
if (n > 2) this.error (4);
val = (this.theToken.value).intValue () % 256;
break;
case 269484097:
if (n != 3) this.error (4);
--i;
pt = J.util.P3.new3 (colors[0], colors[1], colors[2]);
break out;
default:
this.error (4);
}
colors[n++] = val;
}
this.error (4);
break;
case 8:
pt = this.theToken.value;
break;
case 1073741824:
hex = this.parameterAsString (i);
break;
default:
this.error (4);
}
if (this.getToken (++i).tok != 269484097) this.error (4);
if (pt != null) return J.util.ColorUtil.colorPtToInt (pt);
if ((n = J.util.ColorUtil.getArgbFromString ("[" + hex + "]")) == 0) this.error (4);
return n;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "isPoint3f", 
($fz = function (i) {
var isOK;
if ((isOK = (this.tokAt (i) == 8)) || this.tokAt (i) == 9 || this.isFloatParameter (i + 1) && this.isFloatParameter (i + 2) && this.isFloatParameter (i + 3) && this.isFloatParameter (i + 4)) return isOK;
this.ignoreError = true;
var t = this.iToken;
isOK = true;
try {
this.getPoint3f (i, true);
} catch (e) {
if (Clazz.exceptionOf (e, Exception)) {
isOK = false;
} else {
throw e;
}
}
this.ignoreError = false;
this.iToken = t;
return isOK;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "getPoint3f", 
($fz = function (i, allowFractional) {
return this.getPointOrPlane (i, false, allowFractional, true, false, 3, 3);
}, $fz.isPrivate = true, $fz), "~N,~B");
$_M(c$, "getPoint4f", 
($fz = function (i) {
return this.getPointOrPlane (i, false, false, false, false, 4, 4);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "getPointOrPlane", 
($fz = function (index, integerOnly, allowFractional, doConvert, implicitFractional, minDim, maxDim) {
var coord =  Clazz.newFloatArray (6, 0);
var n = 0;
this.coordinatesAreFractional = implicitFractional;
if (this.tokAt (index) == 8) {
if (minDim <= 3 && maxDim >= 3) return this.getToken (index).value;
this.error (22);
}if (this.tokAt (index) == 9) {
if (minDim <= 4 && maxDim >= 4) return this.getToken (index).value;
this.error (22);
}var multiplier = 1;
out : for (var i = index; i < this.st.length; i++) {
switch (this.getToken (i).tok) {
case 1048586:
case 269484080:
case 269484128:
case 269484160:
break;
case 1048590:
break out;
case 269484192:
multiplier = -1;
break;
case 1048615:
if (n == 6) this.error (22);
coord[n++] = this.theToken.intValue;
multiplier = -1;
break;
case 2:
case 1048614:
if (n == 6) this.error (22);
coord[n++] = this.theToken.intValue * multiplier;
multiplier = 1;
break;
case 269484208:
case 1048610:
if (!allowFractional) this.error (22);
if (this.theTok == 269484208) this.getToken (++i);
n--;
if (n < 0 || integerOnly) this.error (22);
if (Clazz.instanceOf (this.theToken.value, Integer) || this.theTok == 2) {
coord[n++] /= (this.theToken.intValue == 2147483647 ? (this.theToken.value).intValue () : this.theToken.intValue);
} else if (Clazz.instanceOf (this.theToken.value, Float)) {
coord[n++] /= (this.theToken.value).floatValue ();
}this.coordinatesAreFractional = true;
break;
case 3:
case 1048611:
if (integerOnly) this.error (22);
if (n == 6) this.error (22);
coord[n++] = (this.theToken.value).floatValue ();
break;
default:
this.error (22);
}
}
if (n < minDim || n > maxDim) this.error (22);
if (n == 3) {
var pt = J.util.P3.new3 (coord[0], coord[1], coord[2]);
if (this.coordinatesAreFractional && doConvert) {
this.fractionalPoint = J.util.P3.newP (pt);
if (!this.chk) this.viewer.toCartesian (pt, !this.viewer.getBoolean (603979848));
}return pt;
}if (n == 4) {
if (this.coordinatesAreFractional) this.error (22);
var plane = J.util.P4.new4 (coord[0], coord[1], coord[2], coord[3]);
return plane;
}return coord;
}, $fz.isPrivate = true, $fz), "~N,~B,~B,~B,~B,~N,~N");
$_M(c$, "xypParameter", 
($fz = function (index) {
var tok = this.tokAt (index);
if (tok == 1073742195) tok = this.tokAt (++index);
if (tok != 269484096 || !this.isFloatParameter (++index)) return null;
var pt =  new J.util.P3 ();
pt.x = this.floatParameter (index);
if (this.tokAt (++index) == 269484080) index++;
if (!this.isFloatParameter (index)) return null;
pt.y = this.floatParameter (index);
var isPercent = (this.tokAt (++index) == 269484210);
if (isPercent) ++index;
if (this.tokAt (index) != 269484097) return null;
this.iToken = index;
pt.z = (isPercent ? -1 : 1) * 3.4028235E38;
return pt;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "isCommandDisplayable", 
($fz = function (i) {
if (i >= this.aatoken.length || i >= this.pcEnd || this.aatoken[i] == null) return false;
return (this.lineIndices[i][1] > this.lineIndices[i][0]);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "checkContinue", 
($fz = function () {
if (this.executionStopped) return false;
if (this.executionStepping && this.isCommandDisplayable (this.pc)) {
this.viewer.setScriptStatus ("Next: " + this.getNextStatement (), "stepping -- type RESUME to continue", 0, null);
this.executionPaused = true;
} else if (!this.executionPaused) {
return true;
}if (J.util.Logger.debugging) {
J.util.Logger.info ("script execution paused at command " + (this.pc + 1) + " level " + this.scriptLevel + ": " + this.thisCommand);
}this.refresh ();
while (this.executionPaused) {
this.viewer.popHoldRepaintWhy ("pause");
var script = this.viewer.getInsertedCommand ();
if (script !== "") {
this.resumePausedExecution ();
this.setErrorMessage (null);
var scSave = this.getScriptContext ();
this.pc--;
try {
this.runScript (script);
} catch (e$$) {
if (Clazz.exceptionOf (e$$, Exception)) {
var e = e$$;
{
this.setErrorMessage ("" + e);
}
} else if (Clazz.exceptionOf (e$$, Error)) {
var er = e$$;
{
this.setErrorMessage ("" + er);
}
} else {
throw e$$;
}
}
if (this.$error) {
this.scriptStatusOrBuffer (this.errorMessage);
this.setErrorMessage (null);
}this.restoreScriptContext (scSave, true, false, false);
this.pauseExecution (false);
}this.doDelay (-100);
this.viewer.pushHoldRepaintWhy ("pause");
}
this.notifyResumeStatus ();
return !this.$error && !this.executionStopped;
}, $fz.isPrivate = true, $fz));
Clazz.overrideMethod (c$, "notifyResumeStatus", 
function () {
if (!this.chk && !this.executionStopped && !this.executionStepping) {
this.viewer.scriptStatus ("script execution " + (this.$error || this.executionStopped ? "interrupted" : "resumed"));
}J.util.Logger.debug ("script execution resumed");
});
$_M(c$, "doDelay", 
($fz = function (millis) {
if (!this.useThreads ()) return;
if (this.isJS && this.allowJSThreads) throw  new J.script.ScriptInterruption (this, "delay", millis);
this.viewer.delayScript (this, millis);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "dispatchCommands", 
($fz = function (isSpt, fromFunc) {
var timeBegin = 0;
if (this.sm == null) this.sm = this.viewer.getShapeManager ();
this.debugScript = this.logMessages = false;
if (!this.chk) this.setDebugging ();
if (this.logMessages) {
timeBegin = System.currentTimeMillis ();
this.viewer.scriptStatus ("Eval.dispatchCommands():" + timeBegin);
this.viewer.scriptStatus (this.$script);
}if (this.pcEnd == 0) this.pcEnd = 2147483647;
if (this.lineEnd == 0) this.lineEnd = 2147483647;
if (this.aatoken == null) return true;
this.commandLoop (fromFunc);
if (this.chk) return true;
var script = this.viewer.getInsertedCommand ();
if (script !== "") {
this.runScriptBuffer (script, null);
} else if (isSpt && this.debugScript && this.viewer.getBoolean (603979879)) {
this.viewer.scriptStatus ("script <exiting>");
}if (!this.isJS || !this.allowJSThreads || fromFunc) return true;
if (this.mustResumeEval || this.thisContext == null) {
var done = (this.thisContext == null);
this.resumeEval (this.thisContext);
this.mustResumeEval = false;
return done;
}return true;
}, $fz.isPrivate = true, $fz), "~B,~B");
$_M(c$, "commandLoop", 
($fz = function (fromFunc) {
var lastCommand = "";
var isForCheck = false;
var vProcess = null;
var lastTime = System.currentTimeMillis ();
for (; this.pc < this.aatoken.length && this.pc < this.pcEnd; this.pc++) {
if (!this.chk && this.isJS && this.allowJSThreads && !fromFunc) {
if (!this.executionPaused && System.currentTimeMillis () - lastTime > 100) {
this.pc--;
this.doDelay (-1);
}lastTime = System.currentTimeMillis ();
}if (!this.chk && !this.checkContinue ()) break;
if (this.lineNumbers[this.pc] > this.lineEnd) break;
this.theToken = (this.aatoken[this.pc].length == 0 ? null : this.aatoken[this.pc][0]);
if (!this.historyDisabled && !this.chk && this.scriptLevel <= this.commandHistoryLevelMax && !this.tQuiet) {
var cmdLine = this.getCommand (this.pc, true, true);
if (this.theToken != null && cmdLine.length > 0 && !cmdLine.equals (lastCommand) && (this.theToken.tok == 135368713 || this.theToken.tok == 102436 || !J.script.T.tokAttr (this.theToken.tok, 102400))) this.viewer.addCommand (lastCommand = cmdLine);
}if (!this.chk) {
var script = this.viewer.getInsertedCommand ();
if (script !== "") this.runScript (script);
}if (!this.setStatement (this.pc)) {
J.util.Logger.info (this.getCommand (this.pc, true, false) + " -- STATEMENT CONTAINING @{} SKIPPED");
continue;
}this.thisCommand = this.getCommand (this.pc, false, true);
this.fullCommand = this.thisCommand + this.getNextComment ();
this.getToken (0);
this.iToken = 0;
if ((this.listCommands || !this.chk && this.scriptLevel > 0) && !this.isJS) {
var milliSecDelay = this.viewer.getInt (536870922);
if (this.listCommands || milliSecDelay > 0) {
if (milliSecDelay > 0) this.viewer.delayScript (this, -milliSecDelay);
this.viewer.scriptEcho ("$[" + this.scriptLevel + "." + this.lineNumbers[this.pc] + "." + (this.pc + 1) + "] " + this.thisCommand);
}}if (vProcess != null && (this.theTok != 1150985 || this.slen < 2 || this.st[1].tok != 102439)) {
vProcess.addLast (this.st);
continue;
}if (this.chk) {
if (this.isCmdLine_c_or_C_Option) J.util.Logger.info (this.thisCommand);
if (this.slen == 1 && this.st[0].tok != 135368713 && this.st[0].tok != 102436) continue;
} else {
if (this.debugScript) this.logDebugScript (0);
if (this.scriptLevel == 0 && this.viewer.global.logCommands) this.viewer.log (this.thisCommand);
if (this.logMessages && this.theToken != null) J.util.Logger.debug (this.theToken.toString ());
}if (this.theToken == null) continue;
if (J.script.T.tokAttr (this.theToken.tok, 135168)) this.processShapeCommand (this.theToken.tok);
 else switch (this.theToken.tok) {
case 0:
if (this.chk || !this.viewer.getBoolean (603979879)) break;
var s = this.theToken.value;
if (s == null) break;
if (this.outputBuffer == null) this.viewer.showMessage (s);
this.scriptStatusOrBuffer (s);
break;
case 266280:
this.pushContext (this.theToken);
break;
case 266278:
this.popContext (true, false);
break;
case 269484066:
break;
case 20500:
case 528410:
if (this.viewer.isHeadless ()) break;
case 102412:
case 102407:
case 102408:
case 364547:
case 102402:
case 1150985:
case 364548:
case 135369224:
case 135369225:
case 102410:
case 102411:
case 102413:
case 102406:
isForCheck = this.flowControl (this.theToken.tok, isForCheck, vProcess);
if (this.theTok == 102439) vProcess = null;
break;
case 4097:
this.animation ();
break;
case 4098:
this.assign ();
break;
case 1610616835:
this.background (1);
break;
case 4100:
this.bind ();
break;
case 4101:
this.bondorder ();
break;
case 4102:
this.calculate ();
break;
case 135270422:
this.cache ();
break;
case 1069064:
this.cd ();
break;
case 12289:
this.center (1);
break;
case 4105:
this.centerAt ();
break;
case 1766856708:
this.color ();
break;
case 135270405:
this.compare ();
break;
case 1095766022:
this.configuration ();
break;
case 4106:
this.connect (1);
break;
case 528395:
this.console ();
break;
case 135270407:
this.data ();
break;
case 1060866:
this.define ();
break;
case 528397:
this.delay ();
break;
case 12291:
this.$delete ();
break;
case 554176526:
this.slab (true);
break;
case 1610625028:
this.display (true);
break;
case 266255:
case 266281:
if (this.chk) break;
if (this.pc > 0 && this.theToken.tok == 266255) this.viewer.clearScriptQueue ();
this.executionStopped = (this.pc > 0 || !this.viewer.global.useScriptQueue);
break;
case 266256:
if (this.chk) return;
this.viewer.exitJmol ();
break;
case 1229984263:
this.file ();
break;
case 1060869:
this.fixed ();
break;
case 4114:
this.font (-1, 0);
break;
case 4115:
case 1095766028:
this.frame (1);
break;
case 102436:
case 135368713:
case 1073741824:
this.$function ();
break;
case 135270410:
this.getProperty ();
break;
case 20482:
this.help ();
break;
case 12294:
this.display (false);
break;
case 1612189718:
this.hbond ();
break;
case 1610616855:
this.history (1);
break;
case 544771:
this.hover ();
break;
case 266264:
if (!this.chk) this.viewer.initialize (!this.isStateScript);
break;
case 4121:
this.invertSelected ();
break;
case 135287308:
this.script (135287308, null);
break;
case 135271426:
this.load ();
break;
case 36869:
this.log ();
break;
case 1052700:
this.mapProperty ();
break;
case 20485:
this.message ();
break;
case 4126:
this.minimize ();
break;
case 4128:
this.move ();
break;
case 4130:
this.moveto ();
break;
case 4131:
this.navigate ();
break;
case 20487:
this.pause ();
break;
case 4133:
case 135270417:
case 1052714:
this.plot (this.st);
break;
case 36865:
this.print ();
break;
case 102439:
this.pushContext (this.theToken);
if (this.parallelProcessor != null) vProcess =  new J.util.JmolList ();
break;
case 135304707:
this.prompt ();
break;
case 4139:
case 4165:
this.undoRedoMove ();
break;
case 266284:
this.refresh ();
break;
case 4141:
this.reset ();
break;
case 4142:
this.restore ();
break;
case 12295:
this.restrict ();
break;
case 266287:
if (!this.chk) this.resumePausedExecution ();
break;
case 36866:
this.returnCmd (null);
break;
case 528432:
this.rotate (false, false);
break;
case 4145:
this.rotate (false, true);
break;
case 4146:
this.save ();
break;
case 1085443:
this.set ();
break;
case 135271429:
this.script (135271429, null);
break;
case 135280132:
this.select (1);
break;
case 1611141171:
this.selectionHalo (1);
break;
case 4148:
this.show ();
break;
case 554176565:
this.slab (false);
break;
case 1611141175:
this.rotate (true, false);
break;
case 1611141176:
this.ssbond ();
break;
case 266298:
if (this.pause ()) this.stepPausedExecution ();
break;
case 528443:
this.stereo ();
break;
case 1641025539:
this.structure ();
break;
case 3158024:
this.subset ();
break;
case 4156:
this.sync ();
break;
case 536875070:
this.timeout (1);
break;
case 4160:
this.translate (false);
break;
case 4162:
this.translate (true);
break;
case 4164:
this.unbind ();
break;
case 4166:
this.vibration ();
break;
case 135270421:
this.write (null);
break;
case 1060873:
this.zap (true);
break;
case 4168:
this.zoom (false);
break;
case 4170:
this.zoom (true);
break;
default:
this.error (47);
}
this.setCursorWait (false);
if (this.executionStepping) {
this.executionPaused = (this.isCommandDisplayable (this.pc + 1));
}}
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "cache", 
($fz = function () {
this.checkLength (3);
var tok = this.tokAt (1);
var fileName = this.parameterAsString (2);
switch (tok) {
case 1276118017:
case 1073742119:
if (!this.chk) {
if (tok == 1073742119 && this.tokAt (2) == 1048579) fileName = null;
var nBytes = this.viewer.cacheFileByName (fileName, tok == 1276118017);
this.showString (nBytes < 0 ? "cache cleared" : nBytes + " bytes " + (tok == 1276118017 ? " cached" : " removed"));
}break;
default:
this.error (22);
}
}, $fz.isPrivate = true, $fz));
$_M(c$, "setCursorWait", 
($fz = function (TF) {
if (!this.chk) this.viewer.setCursor (TF ? 4 : 0);
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "processShapeCommand", 
($fz = function (tok) {
var iShape = 0;
switch (tok) {
case 1611272194:
iShape = 31;
break;
case 1115297793:
iShape = 9;
break;
case 1679429641:
iShape = 32;
break;
case 1113200642:
iShape = 11;
break;
case 135174:
iShape = 23;
break;
case 135402505:
iShape = 25;
break;
case 135175:
iShape = 17;
break;
case 1113198595:
iShape = 16;
break;
case 135176:
iShape = 22;
break;
case 537022465:
iShape = 30;
break;
case 1113198596:
iShape = 20;
break;
case 1611272202:
iShape = 35;
break;
case 1113198597:
iShape = 19;
break;
case 1113200646:
iShape = 8;
break;
case 135180:
iShape = 24;
break;
case 1826248715:
iShape = 5;
break;
case 135182:
iShape = 26;
break;
case 537006096:
case 1746538509:
iShape = 6;
break;
case 1113200647:
iShape = 13;
break;
case 1183762:
iShape = 27;
break;
case 135190:
iShape = 29;
break;
case 135188:
iShape = 28;
break;
case 135192:
iShape = 21;
break;
case 1113200649:
iShape = 14;
break;
case 1113200650:
iShape = 15;
break;
case 1113200651:
iShape = 0;
break;
case 1113200652:
iShape = 7;
break;
case 1650071565:
iShape = 12;
break;
case 1708058:
iShape = 4;
break;
case 1113200654:
iShape = 10;
break;
case 1614417948:
iShape = 33;
break;
case 135198:
iShape = 18;
break;
case 659488:
iShape = 1;
break;
default:
this.error (47);
}
if (this.sm.getShape (iShape) == null && this.slen == 2) {
switch (this.st[1].tok) {
case 1048588:
case 12291:
case 1048587:
return;
}
}switch (tok) {
case 1115297793:
case 1113200642:
case 1113200647:
case 1113200649:
case 1113200650:
case 1650071565:
case 1113200654:
this.proteinShape (iShape);
return;
case 1113198595:
case 1113198597:
this.dots (iShape);
return;
case 1113198596:
this.ellipsoid ();
return;
case 1113200646:
case 1113200651:
case 1113200652:
this.setAtomShapeSize (iShape, (tok == 1113200646 ? -1.0 : 1));
return;
case 1826248715:
this.label (1);
return;
case 135182:
this.lcaoCartoon ();
return;
case 135192:
this.polyhedra ();
return;
case 1708058:
this.struts ();
return;
case 135198:
this.vector ();
return;
case 659488:
this.wireframe ();
return;
}
switch (tok) {
case 1611272194:
this.axes (1);
return;
case 1679429641:
this.boundbox (1);
return;
case 135174:
this.cgo ();
return;
case 135402505:
this.contact ();
return;
case 135175:
this.dipole ();
return;
case 135176:
this.draw ();
return;
case 537022465:
this.echo (1, null, false);
return;
case 1611272202:
this.frank (1);
return;
case 135180:
case 135190:
case 135188:
this.isosurface (iShape);
return;
case 537006096:
case 1746538509:
this.measure ();
return;
case 1183762:
this.mo (false);
return;
case 1614417948:
this.unitcell (1);
return;
}
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "flowControl", 
($fz = function (tok, isForCheck, vProcess) {
var ct;
switch (tok) {
case 20500:
this.gotoCmd (this.parameterAsString (this.checkLast (1)));
return isForCheck;
case 528410:
if (!this.chk) this.pc = -1;
this.delay ();
return isForCheck;
}
var pt = this.st[0].intValue;
var isDone = (pt < 0 && !this.chk);
var isOK = true;
var ptNext = 0;
switch (tok) {
case 102412:
ct = this.theToken;
this.pushContext (ct);
if (!isDone && ct.name0 != null) this.contextVariables.put (ct.name0, ct.contextVariables.get (ct.name0));
isOK = !isDone;
break;
case 102410:
case 102413:
case 102411:
ptNext = Math.abs (this.aatoken[Math.abs (pt)][0].intValue);
switch (isDone ? 0 : this.switchCmd (this.theToken, tok)) {
case 0:
ptNext = -ptNext;
isOK = false;
break;
case -1:
isOK = false;
break;
case 1:
}
this.aatoken[this.pc][0].intValue = Math.abs (pt);
this.theToken = this.aatoken[Math.abs (pt)][0];
if (this.theToken.tok != 1150985) this.theToken.intValue = ptNext;
break;
case 135369225:
case 102402:
isOK = (!isDone && this.ifCmd ());
if (this.chk) break;
ptNext = Math.abs (this.aatoken[Math.abs (pt)][0].intValue);
ptNext = (isDone || isOK ? -ptNext : ptNext);
this.aatoken[Math.abs (pt)][0].intValue = ptNext;
if (tok == 102412) this.aatoken[this.pc][0].intValue = -pt;
break;
case 364547:
this.checkLength (1);
if (pt < 0 && !this.chk) this.pc = -pt - 1;
break;
case 364548:
this.checkLength (1);
break;
case 102406:
if (!isForCheck) this.pushContext (this.theToken);
isForCheck = false;
if (!this.ifCmd () && !this.chk) {
this.pc = pt;
this.popContext (true, false);
}break;
case 102407:
if (!this.chk) {
this.breakCmd (pt);
break;
}if (this.slen == 1) break;
var n = this.intParameter (this.checkLast (1));
if (this.chk) break;
for (var i = 0; i < n; i++) this.popContext (true, false);

break;
case 102408:
isForCheck = true;
if (!this.chk) this.pc = pt - 1;
if (this.slen > 1) this.intParameter (this.checkLast (1));
break;
case 135369224:
var token = this.theToken;
var pts =  Clazz.newIntArray (2, 0);
var j = 0;
var bsOrList = null;
for (var i = 1, nSkip = 0; i < this.slen && j < 2; i++) {
switch (this.tokAt (i)) {
case 1048591:
if (nSkip > 0) nSkip--;
 else pts[j++] = i;
break;
case 1073741980:
nSkip -= 2;
if (this.tokAt (++i) == 1048577 || this.tokAt (i) == 10) {
bsOrList = this.atomExpressionAt (i);
if (this.isBondSet) bsOrList =  new J.modelset.Bond.BondSet (bsOrList);
} else {
var what = this.parameterExpressionList (-i, 1, false);
if (what == null || what.size () < 1) this.error (22);
var vl = what.get (0);
switch (vl.tok) {
case 10:
bsOrList = J.script.SV.getBitSet (vl, false);
break;
case 7:
bsOrList = vl.getList ();
break;
default:
this.error (22);
}
}i = this.iToken;
break;
case 135280132:
nSkip += 2;
break;
}
}
if (isForCheck) {
j = (bsOrList == null ? pts[1] + 1 : 2);
} else {
this.pushContext (token);
j = 2;
}if (this.tokAt (j) == 36868) j++;
var key = this.parameterAsString (j);
var isMinusMinus = key.equals ("--") || key.equals ("++");
if (isMinusMinus) {
key = this.parameterAsString (++j);
}var v = null;
if (J.script.T.tokAttr (this.tokAt (j), 1073741824) || (v = this.getContextVariableAsVariable (key)) != null) {
if (bsOrList == null && !isMinusMinus && this.getToken (++j).tok != 269484436) this.error (22);
if (bsOrList == null) {
if (isMinusMinus) j -= 2;
this.setVariable (++j, this.slen - 1, key, 0);
} else {
isOK = true;
var key_incr = (key + "_incr");
if (v == null) v = this.getContextVariableAsVariable (key_incr);
if (v == null) {
if (key.startsWith ("_")) this.error (22);
v = this.viewer.getOrSetNewVariable (key_incr, true);
}if (!isForCheck || v.tok != 10 && v.tok != 7 || v.intValue == 2147483647) {
if (isForCheck) {
isOK = false;
} else {
v.setv (J.script.SV.getVariable (bsOrList), false);
v.intValue = 1;
}} else {
v.intValue++;
}isOK = isOK && (Clazz.instanceOf (bsOrList, J.util.BS) ? J.script.SV.bsSelectVar (v).cardinality () == 1 : v.intValue <= v.getList ().size ());
if (isOK) {
v = J.script.SV.selectItemVar (v);
var t = this.getContextVariableAsVariable (key);
if (t == null) t = this.viewer.getOrSetNewVariable (key, true);
t.setv (v, false);
}}}if (bsOrList == null) isOK = this.parameterExpressionBoolean (pts[0] + 1, pts[1]);
pt++;
if (!isOK) this.popContext (true, false);
isForCheck = false;
break;
case 1150985:
switch (this.getToken (this.checkLast (1)).tok) {
case 364558:
var trycmd = this.getToken (1).value;
if (this.chk) return false;
this.runFunctionRet (trycmd, "try", null, null, true, true, true);
return false;
case 102412:
this.popContext (true, false);
break;
case 135368713:
case 102436:
this.viewer.addFunction (this.theToken.value);
return isForCheck;
case 102439:
this.addProcess (vProcess, pt, this.pc);
this.popContext (true, false);
break;
case 102410:
if (pt > 0 && this.switchCmd (this.aatoken[pt][0], 0) == -1) {
for (; pt < this.pc; pt++) if ((tok = this.aatoken[pt][0].tok) != 102413 && tok != 102411) break;

isOK = (this.pc == pt);
}break;
}
if (isOK) isOK = (this.theTok == 102412 || this.theTok == 102439 || this.theTok == 135369225 || this.theTok == 102410);
isForCheck = (this.theTok == 135369224 || this.theTok == 102406);
break;
}
if (!isOK && !this.chk) this.pc = Math.abs (pt) - 1;
return isForCheck;
}, $fz.isPrivate = true, $fz), "~N,~B,J.util.JmolList");
$_M(c$, "gotoCmd", 
($fz = function (strTo) {
var pcTo = (strTo == null ? this.aatoken.length - 1 : -1);
var s = null;
for (var i = pcTo + 1; i < this.aatoken.length; i++) {
var tokens = this.aatoken[i];
var tok = tokens[0].tok;
switch (tok) {
case 20485:
case 0:
s = tokens[tokens.length - 1].value;
if (tok == 0) s = s.substring (s.startsWith ("#") ? 1 : 2);
break;
default:
continue;
}
if (s.equalsIgnoreCase (strTo)) {
pcTo = i;
break;
}}
if (pcTo < 0) this.error (22);
if (strTo == null) pcTo = 0;
var di = (pcTo < this.pc ? 1 : -1);
var nPush = 0;
for (var i = pcTo; i != this.pc; i += di) {
switch (this.aatoken[i][0].tok) {
case 266280:
case 102439:
case 135369224:
case 102412:
case 102406:
nPush++;
break;
case 266278:
nPush--;
break;
case 1150985:
switch (this.aatoken[i][1].tok) {
case 102439:
case 135369224:
case 102412:
case 102406:
nPush--;
}
break;
}
}
if (strTo == null) {
pcTo = 2147483647;
for (; nPush > 0; --nPush) this.popContext (false, false);

}if (nPush != 0) this.error (22);
if (!this.chk) this.pc = pcTo - 1;
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "breakCmd", 
($fz = function (pt) {
if (pt < 0) {
this.getContextVariableAsVariable ("_breakval").intValue = -pt;
this.pcEnd = this.pc;
return;
}this.pc = Math.abs (this.aatoken[pt][0].intValue);
var tok = this.aatoken[pt][0].tok;
if (tok == 102411 || tok == 102413) {
this.theToken = this.aatoken[this.pc--][0];
var ptNext = Math.abs (this.theToken.intValue);
if (this.theToken.tok != 1150985) this.theToken.intValue = -ptNext;
} else {
while (this.thisContext != null && !J.script.ScriptCompiler.isBreakableContext (this.thisContext.token.tok)) this.popContext (true, false);

this.popContext (true, false);
}}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "addProcess", 
($fz = function (vProcess, pc, pt) {
if (this.parallelProcessor == null) return;
var statements =  new Array (pt);
for (var i = 0; i < vProcess.size (); i++) statements[i + 1 - pc] = vProcess.get (i);

var context = this.getScriptContext ();
context.aatoken = statements;
context.pc = 1 - pc;
context.pcEnd = pt;
this.parallelProcessor.addProcess ("p" + (($t$ = ++ J.script.ScriptEvaluator.iProcess, J.script.ScriptEvaluator.prototype.iProcess = J.script.ScriptEvaluator.iProcess, $t$)), context);
}, $fz.isPrivate = true, $fz), "J.util.JmolList,~N,~N");
$_M(c$, "switchCmd", 
($fz = function (c, tok) {
if (tok == 102410) c.addName ("_var");
var $var = c.contextVariables.get ("_var");
if ($var == null) return 1;
if (tok == 0) {
c.contextVariables.remove ("_var");
return -1;
}if (tok == 102413) return -1;
var v = this.parameterExpressionToken (1);
if (tok == 102411) {
var isOK = J.script.SV.areEqual ($var, v);
if (isOK) c.contextVariables.remove ("_var");
return isOK ? 1 : -1;
}c.contextVariables.put ("_var", v);
return 1;
}, $fz.isPrivate = true, $fz), "J.script.ContextToken,~N");
$_M(c$, "ifCmd", 
($fz = function () {
return this.parameterExpressionBoolean (1, 0);
}, $fz.isPrivate = true, $fz));
$_M(c$, "returnCmd", 
($fz = function (tv) {
var t = this.getContextVariableAsVariable ("_retval");
if (t == null) {
if (!this.chk) this.gotoCmd (null);
return;
}var v = (tv != null || this.slen == 1 ? null : this.parameterExpressionToken (1));
if (this.chk) return;
if (tv == null) tv = (v == null ? J.script.SV.newScriptVariableInt (0) : v);
t.value = tv.value;
t.intValue = tv.intValue;
t.tok = tv.tok;
this.gotoCmd (null);
}, $fz.isPrivate = true, $fz), "J.script.SV");
$_M(c$, "help", 
($fz = function () {
if (this.chk) return;
var what = this.optParameterAsString (1).toLowerCase ();
var pt = 0;
if (what.startsWith ("mouse") && (pt = what.indexOf (" ")) >= 0 && pt == what.lastIndexOf (" ")) {
this.showString (this.viewer.getBindingInfo (what.substring (pt + 1)));
return;
}if (J.script.T.tokAttr (J.script.T.getTokFromName (what), 4096)) what = "?command=" + what;
this.viewer.getHelp (what);
}, $fz.isPrivate = true, $fz));
$_M(c$, "move", 
($fz = function () {
if (this.slen > 11) this.error (2);
var dRot = J.util.V3.new3 (this.floatParameter (1), this.floatParameter (2), this.floatParameter (3));
var dZoom = this.floatParameter (4);
var dTrans = J.util.V3.new3 (this.intParameter (5), this.intParameter (6), this.intParameter (7));
var dSlab = this.floatParameter (8);
var floatSecondsTotal = this.floatParameter (9);
var fps = (this.slen == 11 ? this.intParameter (10) : 30);
if (this.chk) return;
this.refresh ();
if (!this.useThreads ()) floatSecondsTotal = 0;
this.viewer.move (this, dRot, dZoom, dTrans, dSlab, floatSecondsTotal, fps);
if (floatSecondsTotal > 0 && this.isJS) throw  new J.script.ScriptInterruption (this, "move", 1);
}, $fz.isPrivate = true, $fz));
$_M(c$, "moveto", 
($fz = function () {
if (this.slen == 2 && this.tokAt (1) == 1073742162) {
if (!this.chk) this.viewer.stopMotion ();
return;
}var floatSecondsTotal;
if (this.slen == 2 && this.isFloatParameter (1)) {
floatSecondsTotal = this.floatParameter (1);
if (this.chk) return;
if (!this.useThreads ()) floatSecondsTotal = 0;
if (floatSecondsTotal > 0) this.refresh ();
this.viewer.moveTo (this, floatSecondsTotal, null, J.viewer.JC.axisZ, 0, null, 100, 0, 0, 0, null, NaN, NaN, NaN);
if (this.isJS && floatSecondsTotal > 0 && this.viewer.global.waitForMoveTo) throw  new J.script.ScriptInterruption (this, "moveTo", 1);
return;
}var axis = J.util.V3.new3 (NaN, 0, 0);
var center = null;
var i = 1;
floatSecondsTotal = (this.isFloatParameter (i) ? this.floatParameter (i++) : 2.0);
var degrees = 90;
var bsCenter = null;
switch (this.getToken (i).tok) {
case 135270417:
var q;
var isMolecular = false;
if (this.tokAt (++i) == 1073742029) {
isMolecular = true;
i++;
}if (this.tokAt (i) == 10 || this.tokAt (i) == 1048577) {
isMolecular = true;
center = this.centerParameter (i);
if (!(Clazz.instanceOf (this.expressionResult, J.util.BS))) this.error (22);
bsCenter = this.expressionResult;
q = (this.chk ?  new J.util.Quaternion () : this.viewer.getAtomQuaternion (bsCenter.nextSetBit (0)));
} else {
q = this.getQuaternionParameter (i);
}i = this.iToken + 1;
if (q == null) this.error (22);
var aa = q.toAxisAngle4f ();
axis.set (aa.x, aa.y, aa.z);
degrees = (isMolecular ? -1 : 1) * (aa.angle * 180.0 / 3.141592653589793);
break;
case 9:
case 8:
case 1048586:
if (this.isPoint3f (i)) {
axis.setT (this.getPoint3f (i, true));
i = this.iToken + 1;
degrees = this.floatParameter (i++);
} else {
var pt4 = this.getPoint4f (i);
i = this.iToken + 1;
axis.set (pt4.x, pt4.y, pt4.z);
degrees = (pt4.x == 0 && pt4.y == 0 && pt4.z == 0 ? NaN : pt4.w);
}break;
case 1073741954:
axis.set (1, 0, 0);
degrees = 0;
this.checkLength (++i);
break;
case 1073741860:
axis.set (0, 1, 0);
degrees = 180;
this.checkLength (++i);
break;
case 1073741996:
axis.set (0, 1, 0);
this.checkLength (++i);
break;
case 1073742128:
axis.set (0, -1, 0);
this.checkLength (++i);
break;
case 1074790748:
axis.set (1, 0, 0);
this.checkLength (++i);
break;
case 1073741871:
axis.set (-1, 0, 0);
this.checkLength (++i);
break;
default:
axis = J.util.V3.new3 (this.floatParameter (i++), this.floatParameter (i++), this.floatParameter (i++));
degrees = this.floatParameter (i++);
}
if (Float.isNaN (axis.x) || Float.isNaN (axis.y) || Float.isNaN (axis.z)) axis.set (0, 0, 0);
 else if (axis.length () == 0 && degrees == 0) degrees = NaN;
var isChange = !this.viewer.isInPosition (axis, degrees);
var zoom = (this.isFloatParameter (i) ? this.floatParameter (i++) : NaN);
var xTrans = 0;
var yTrans = 0;
if (this.isFloatParameter (i) && !this.isCenterParameter (i)) {
xTrans = this.floatParameter (i++);
yTrans = this.floatParameter (i++);
if (!isChange && Math.abs (xTrans - this.viewer.getTranslationXPercent ()) >= 1) isChange = true;
if (!isChange && Math.abs (yTrans - this.viewer.getTranslationYPercent ()) >= 1) isChange = true;
}if (bsCenter == null && i != this.slen) {
center = this.centerParameter (i);
if (Clazz.instanceOf (this.expressionResult, J.util.BS)) bsCenter = this.expressionResult;
i = this.iToken + 1;
}var rotationRadius = NaN;
var zoom0 = this.viewer.getZoomSetting ();
if (center != null) {
if (!isChange && center.distance (this.viewer.getRotationCenter ()) >= 0.1) isChange = true;
if (this.isFloatParameter (i)) rotationRadius = this.floatParameter (i++);
if (!this.isCenterParameter (i)) {
if ((rotationRadius == 0 || Float.isNaN (rotationRadius)) && (zoom == 0 || Float.isNaN (zoom))) {
var newZoom = Math.abs (this.getZoom (0, i, bsCenter, (zoom == 0 ? 0 : zoom0)));
i = this.iToken + 1;
zoom = newZoom;
} else {
if (!isChange && Math.abs (rotationRadius - this.viewer.getFloat (570425388)) >= 0.1) isChange = true;
}}}if (zoom == 0 || Float.isNaN (zoom)) zoom = 100;
if (Float.isNaN (rotationRadius)) rotationRadius = 0;
if (!isChange && Math.abs (zoom - zoom0) >= 1) isChange = true;
var navCenter = null;
var xNav = NaN;
var yNav = NaN;
var navDepth = NaN;
if (i != this.slen) {
navCenter = this.centerParameter (i);
i = this.iToken + 1;
if (i != this.slen) {
xNav = this.floatParameter (i++);
yNav = this.floatParameter (i++);
}if (i != this.slen) navDepth = this.floatParameter (i++);
}if (i != this.slen) this.error (2);
if (this.chk) return;
if (!isChange) floatSecondsTotal = 0;
if (floatSecondsTotal > 0) this.refresh ();
if (!this.useThreads ()) floatSecondsTotal = 0;
this.viewer.moveTo (this, floatSecondsTotal, center, axis, degrees, null, zoom, xTrans, yTrans, rotationRadius, navCenter, xNav, yNav, navDepth);
if (this.isJS && floatSecondsTotal > 0 && this.viewer.global.waitForMoveTo) throw  new J.script.ScriptInterruption (this, "moveTo", 1);
}, $fz.isPrivate = true, $fz));
$_M(c$, "navigate", 
($fz = function () {
if (this.slen == 1) {
this.setBooleanProperty ("navigationMode", true);
return;
}var rotAxis = J.util.V3.new3 (0, 1, 0);
var list =  new J.util.JmolList ();
var pt;
if (this.slen == 2) {
switch (this.getToken (1).tok) {
case 1048589:
case 1048588:
if (this.chk) return;
this.setObjectMad (31, "axes", 1);
this.setShapeProperty (31, "position", J.util.P3.new3 (50, 50, 3.4028235E38));
this.setBooleanProperty ("navigationMode", true);
this.viewer.setNavOn (this.theTok == 1048589);
return;
case 1073742162:
if (!this.chk) this.viewer.setNavXYZ (0, 0, 0);
return;
case 8:
break;
default:
this.error (22);
}
}if (!this.chk && !this.viewer.getBoolean (603979886)) this.setBooleanProperty ("navigationMode", true);
for (var i = 1; i < this.slen; i++) {
var timeSec = (this.isFloatParameter (i) ? this.floatParameter (i++) : 2);
if (timeSec < 0) this.error (22);
if (!this.chk && timeSec > 0) this.refresh ();
switch (this.getToken (i).tok) {
case 8:
case 1048586:
pt = this.getPoint3f (i, true);
this.iToken++;
if (this.iToken != this.slen) this.error (22);
if (!this.chk) this.viewer.setNavXYZ (pt.x, pt.y, pt.z);
return;
case 554176526:
var depth = this.floatParameter (++i);
if (!this.chk) list.addLast ([Integer.$valueOf (554176526), Float.$valueOf (timeSec), Float.$valueOf (depth)]);
continue;
case 12289:
pt = this.centerParameter (++i);
i = this.iToken;
if (!this.chk) list.addLast ([Integer.$valueOf (135266320), Float.$valueOf (timeSec), pt]);
continue;
case 528432:
switch (this.getToken (++i).tok) {
case 1112541205:
rotAxis.set (1, 0, 0);
i++;
break;
case 1112541206:
rotAxis.set (0, 1, 0);
i++;
break;
case 1112541207:
rotAxis.set (0, 0, 1);
i++;
break;
case 8:
case 1048586:
rotAxis.setT (this.getPoint3f (i, true));
i = this.iToken + 1;
break;
case 1073741824:
this.error (22);
break;
}
var degrees = this.floatParameter (i);
if (!this.chk) list.addLast ([Integer.$valueOf (528432), Float.$valueOf (timeSec), rotAxis, Float.$valueOf (degrees)]);
continue;
case 4160:
var x = NaN;
var y = NaN;
if (this.isFloatParameter (++i)) {
x = this.floatParameter (i);
y = this.floatParameter (++i);
} else {
switch (this.tokAt (i)) {
case 1112541205:
x = this.floatParameter (++i);
break;
case 1112541206:
y = this.floatParameter (++i);
break;
default:
pt = this.centerParameter (i);
i = this.iToken;
if (!this.chk) list.addLast ([Integer.$valueOf (4160), Float.$valueOf (timeSec), pt]);
continue;
}
}if (!this.chk) list.addLast ([Integer.$valueOf (269484210), Float.$valueOf (timeSec), Float.$valueOf (x), Float.$valueOf (y)]);
continue;
case 269484208:
continue;
case 1113200654:
var pathGuide;
var vp =  new J.util.JmolList ();
var bs = this.atomExpressionAt (++i);
i = this.iToken;
if (this.chk) return;
this.viewer.getPolymerPointsAndVectors (bs, vp);
var n;
if ((n = vp.size ()) > 0) {
pathGuide =  new Array (n);
for (var j = 0; j < n; j++) {
pathGuide[j] = vp.get (j);
}
list.addLast ([Integer.$valueOf (1113200654), Float.$valueOf (timeSec), pathGuide]);
continue;
}break;
case 1073742084:
var path;
var theta = null;
if (this.getToken (i + 1).tok == 1048583) {
i++;
var pathID = this.objectNameParameter (++i);
if (this.chk) return;
this.setShapeProperty (22, "thisID", pathID);
path = this.getShapeProperty (22, "vertices");
this.refresh ();
if (path == null) this.error (22);
var indexStart = Clazz.floatToInt (this.isFloatParameter (i + 1) ? this.floatParameter (++i) : 0);
var indexEnd = Clazz.floatToInt (this.isFloatParameter (i + 1) ? this.floatParameter (++i) : 2147483647);
list.addLast ([Integer.$valueOf (1073742084), Float.$valueOf (timeSec), path, theta, [indexStart, indexEnd]]);
continue;
}var v =  new J.util.JmolList ();
while (this.isCenterParameter (i + 1)) {
v.addLast (this.centerParameter (++i));
i = this.iToken;
}
if (v.size () > 0) {
path = v.toArray ( new Array (v.size ()));
if (!this.chk) list.addLast ([Integer.$valueOf (1073742084), Float.$valueOf (timeSec), path, theta, [0, 2147483647]]);
continue;
}default:
this.error (22);
}
}
if (!this.chk) this.viewer.navigateList (this, list);
}, $fz.isPrivate = true, $fz));
$_M(c$, "bondorder", 
($fz = function () {
this.checkLength (-3);
var order = 0;
switch (this.getToken (1).tok) {
case 2:
case 3:
if ((order = J.util.JmolEdge.getBondOrderFromFloat (this.floatParameter (1))) == 131071) this.error (22);
break;
default:
if ((order = J.script.ScriptEvaluator.getBondOrderFromString (this.parameterAsString (1))) == 131071) this.error (22);
if (order == 33 && this.tokAt (2) == 3) {
order = J.script.ScriptEvaluator.getPartialBondOrderFromFloatEncodedInt (this.st[2].intValue);
}}
this.setShapeProperty (1, "bondOrder", Integer.$valueOf (order));
}, $fz.isPrivate = true, $fz));
$_M(c$, "console", 
($fz = function () {
switch (this.getToken (1).tok) {
case 1048588:
if (!this.chk) this.viewer.showConsole (false);
break;
case 1048589:
if (!this.chk) this.viewer.showConsole (true);
break;
case 1073741882:
if (!this.chk) this.viewer.clearConsole ();
break;
case 135270421:
this.showString (this.stringParameter (2));
break;
default:
this.error (22);
}
}, $fz.isPrivate = true, $fz));
$_M(c$, "centerAt", 
($fz = function () {
var relativeTo = null;
switch (this.getToken (1).tok) {
case 1073741826:
relativeTo = "absolute";
break;
case 96:
relativeTo = "average";
break;
case 1679429641:
relativeTo = "boundbox";
break;
default:
this.error (22);
}
var pt = J.util.P3.new3 (0, 0, 0);
if (this.slen == 5) {
pt.x = this.floatParameter (2);
pt.y = this.floatParameter (3);
pt.z = this.floatParameter (4);
} else if (this.isCenterParameter (2)) {
pt = this.centerParameter (2);
this.checkLast (this.iToken);
} else {
this.checkLength (2);
}if (!this.chk) this.viewer.setCenterAt (relativeTo, pt);
}, $fz.isPrivate = true, $fz));
$_M(c$, "stereo", 
($fz = function () {
var stereoMode = J.constant.EnumStereoMode.DOUBLE;
var degrees = -5;
var degreesSeen = false;
var colors = null;
var colorpt = 0;
for (var i = 1; i < this.slen; ++i) {
if (this.isColorParam (i)) {
if (colorpt > 1) this.error (2);
if (colorpt == 0) colors =  Clazz.newIntArray (2, 0);
if (!degreesSeen) degrees = 3;
colors[colorpt] = this.getArgbParam (i);
if (colorpt++ == 0) colors[1] = ~colors[0];
i = this.iToken;
continue;
}switch (this.getToken (i).tok) {
case 1048589:
this.checkLast (this.iToken = 1);
this.iToken = 1;
break;
case 1048588:
this.checkLast (this.iToken = 1);
stereoMode = J.constant.EnumStereoMode.NONE;
break;
case 2:
case 3:
degrees = this.floatParameter (i);
degreesSeen = true;
break;
case 1073741824:
if (!degreesSeen) degrees = 3;
stereoMode = J.constant.EnumStereoMode.getStereoMode (this.parameterAsString (i));
if (stereoMode != null) break;
default:
this.error (22);
}
}
if (this.chk) return;
this.viewer.setStereoMode (colors, stereoMode, degrees);
}, $fz.isPrivate = true, $fz));
$_M(c$, "compare", 
($fz = function () {
var isQuaternion = false;
var doRotate = false;
var doTranslate = false;
var doAnimate = false;
var nSeconds = NaN;
var data1 = null;
var data2 = null;
var bsAtoms1 = null;
var bsAtoms2 = null;
var vAtomSets = null;
var vQuatSets = null;
var bsFrom = (this.tokAt (1) == 3158024 ? null : this.atomExpressionAt (1));
var bsTo = (this.tokAt (++this.iToken) == 3158024 ? null : this.atomExpressionAt (this.iToken));
if (bsFrom == null || bsTo == null) this.error (22);
var bsSubset = null;
var isSmiles = false;
var strSmiles = null;
var bs = J.util.BSUtil.copy (bsFrom);
bs.or (bsTo);
var isToSubsetOfFrom = bs.equals (bsFrom);
var isFrames = isToSubsetOfFrom;
for (var i = this.iToken + 1; i < this.slen; ++i) {
switch (this.getToken (i).tok) {
case 4115:
isFrames = true;
break;
case 135267336:
isSmiles = true;
case 135267335:
strSmiles = this.stringParameter (++i);
break;
case 3:
case 2:
nSeconds = Math.abs (this.floatParameter (i));
if (nSeconds > 0) doAnimate = true;
break;
case 269484080:
break;
case 3158024:
bsSubset = this.atomExpressionAt (++i);
i = this.iToken;
break;
case 10:
case 1048577:
if (vQuatSets != null) this.error (22);
bsAtoms1 = this.atomExpressionAt (this.iToken);
var tok = (isToSubsetOfFrom ? 0 : this.tokAt (this.iToken + 1));
bsAtoms2 = (tok == 10 || tok == 1048577 ? this.atomExpressionAt (++this.iToken) : J.util.BSUtil.copy (bsAtoms1));
if (bsSubset != null) {
bsAtoms1.and (bsSubset);
bsAtoms2.and (bsSubset);
}bsAtoms2.and (bsTo);
if (vAtomSets == null) vAtomSets =  new J.util.JmolList ();
vAtomSets.addLast ([bsAtoms1, bsAtoms2]);
i = this.iToken;
break;
case 7:
if (vAtomSets != null) this.error (22);
isQuaternion = true;
data1 = J.script.ScriptMathProcessor.getQuaternionArray ((this.theToken).getList (), 1073742001);
this.getToken (++i);
data2 = J.script.ScriptMathProcessor.getQuaternionArray ((this.theToken).getList (), 1073742001);
if (vQuatSets == null) vQuatSets =  new J.util.JmolList ();
vQuatSets.addLast ([data1, data2]);
break;
case 1073742077:
isQuaternion = true;
break;
case 135266320:
case 1141899265:
isQuaternion = false;
break;
case 528432:
doRotate = true;
break;
case 4160:
doTranslate = true;
break;
default:
this.error (22);
}
}
if (this.chk) return;
if (isFrames) nSeconds = 0;
if (Float.isNaN (nSeconds) || nSeconds < 0) nSeconds = 1;
 else if (!doRotate && !doTranslate) doRotate = doTranslate = true;
doAnimate = (nSeconds != 0);
var isAtoms = (!isQuaternion && strSmiles == null);
if (vAtomSets == null && vQuatSets == null) {
if (bsSubset == null) {
bsAtoms1 = (isAtoms ? this.viewer.getAtomBitSet ("spine") :  new J.util.BS ());
if (bsAtoms1.nextSetBit (0) < 0) {
bsAtoms1 = bsFrom;
bsAtoms2 = bsTo;
} else {
bsAtoms2 = J.util.BSUtil.copy (bsAtoms1);
bsAtoms1.and (bsFrom);
bsAtoms2.and (bsTo);
}} else {
bsAtoms1 = J.util.BSUtil.copy (bsFrom);
bsAtoms2 = J.util.BSUtil.copy (bsTo);
bsAtoms1.and (bsSubset);
bsAtoms2.and (bsSubset);
bsAtoms1.and (bsFrom);
bsAtoms2.and (bsTo);
}vAtomSets =  new J.util.JmolList ();
vAtomSets.addLast ([bsAtoms1, bsAtoms2]);
}var bsFrames;
if (isFrames) {
var bsModels = this.viewer.getModelBitSet (bsFrom, false);
bsFrames =  new Array (bsModels.cardinality ());
for (var i = 0, iModel = bsModels.nextSetBit (0); iModel >= 0; iModel = bsModels.nextSetBit (iModel + 1), i++) bsFrames[i] = this.viewer.getModelUndeletedAtomsBitSet (iModel);

} else {
bsFrames = [bsFrom];
}for (var iFrame = 0; iFrame < bsFrames.length; iFrame++) {
bsFrom = bsFrames[iFrame];
var retStddev =  Clazz.newFloatArray (2, 0);
var q = null;
var vQ =  new J.util.JmolList ();
var centerAndPoints = null;
var vAtomSets2 = (isFrames ?  new J.util.JmolList () : vAtomSets);
for (var i = 0; i < vAtomSets.size (); ++i) {
var bss = vAtomSets.get (i);
if (isFrames) vAtomSets2.addLast (bss = [J.util.BSUtil.copy (bss[0]), bss[1]]);
bss[0].and (bsFrom);
}
if (isAtoms) {
centerAndPoints = this.viewer.getCenterAndPoints (vAtomSets2, true);
q = J.util.Measure.calculateQuaternionRotation (centerAndPoints, retStddev, true);
var r0 = (Float.isNaN (retStddev[1]) ? NaN : Math.round (retStddev[0] * 100) / 100);
var r1 = (Float.isNaN (retStddev[1]) ? NaN : Math.round (retStddev[1] * 100) / 100);
this.showString ("RMSD " + r0 + " --> " + r1 + " Angstroms");
} else if (isQuaternion) {
if (vQuatSets == null) {
for (var i = 0; i < vAtomSets2.size (); i++) {
var bss = vAtomSets2.get (i);
data1 = this.viewer.getAtomGroupQuaternions (bss[0], 2147483647);
data2 = this.viewer.getAtomGroupQuaternions (bss[1], 2147483647);
for (var j = 0; j < data1.length && j < data2.length; j++) {
vQ.addLast (data2[j].div (data1[j]));
}
}
} else {
for (var j = 0; j < data1.length && j < data2.length; j++) {
vQ.addLast (data2[j].div (data1[j]));
}
}retStddev[0] = 0;
data1 = vQ.toArray ( new Array (vQ.size ()));
q = J.util.Quaternion.sphereMean (data1, retStddev, 0.0001);
this.showString ("RMSD = " + retStddev[0] + " degrees");
} else {
var m4 =  new J.util.Matrix4f ();
var stddev = this.getSmilesCorrelation (bsFrom, bsTo, strSmiles, null, null, m4, null, !isSmiles, false);
if (Float.isNaN (stddev)) this.error (22);
var translation =  new J.util.V3 ();
m4.get (translation);
var m3 =  new J.util.Matrix3f ();
m4.getRotationScale (m3);
q = J.util.Quaternion.newM (m3);
}if (centerAndPoints == null) centerAndPoints = this.viewer.getCenterAndPoints (vAtomSets2, true);
var pt1 =  new J.util.P3 ();
var endDegrees = NaN;
var translation = null;
if (doTranslate) {
translation = J.util.V3.newV (centerAndPoints[1][0]);
translation.sub (centerAndPoints[0][0]);
endDegrees = 0;
}if (doRotate) {
if (q == null) this.evalError ("option not implemented", null);
pt1.setT (centerAndPoints[0][0]);
pt1.add (q.getNormal ());
endDegrees = q.getTheta ();
}if (Float.isNaN (endDegrees) || Float.isNaN (pt1.x)) continue;
var ptsB = null;
if (doRotate && doTranslate && nSeconds != 0) {
var ptsA = this.viewer.getAtomPointVector (bsFrom);
var m4 = J.script.ScriptMathProcessor.getMatrix4f (q.getMatrix (), translation);
ptsB = J.util.Measure.transformPoints (ptsA, m4, centerAndPoints[0][0]);
}if (!this.useThreads ()) doAnimate = false;
this.viewer.rotateAboutPointsInternal (this, centerAndPoints[0][0], pt1, endDegrees / nSeconds, endDegrees, doAnimate, bsFrom, translation, ptsB);
if (doAnimate && this.isJS) throw  new J.script.ScriptInterruption (this, "compare", 1);
}
}, $fz.isPrivate = true, $fz));
$_M(c$, "getSmilesCorrelation", 
function (bsA, bsB, smiles, ptsA, ptsB, m, vReturn, isSmarts, asMap) {
var tolerance = 0.1;
try {
if (ptsA == null) {
ptsA =  new J.util.JmolList ();
ptsB =  new J.util.JmolList ();
}if (m == null) m =  new J.util.Matrix4f ();
var atoms = this.viewer.modelSet.atoms;
var atomCount = this.viewer.getAtomCount ();
var maps = this.viewer.getSmilesMatcher ().getCorrelationMaps (smiles, atoms, atomCount, bsA, isSmarts, true);
if (maps == null) this.evalError (this.viewer.getSmilesMatcher ().getLastException (), null);
if (maps.length == 0) return NaN;
for (var i = 0; i < maps[0].length; i++) ptsA.addLast (atoms[maps[0][i]]);

maps = this.viewer.getSmilesMatcher ().getCorrelationMaps (smiles, atoms, atomCount, bsB, isSmarts, false);
if (maps == null) this.evalError (this.viewer.getSmilesMatcher ().getLastException (), null);
if (maps.length == 0) return NaN;
if (asMap) {
for (var i = 0; i < maps.length; i++) for (var j = 0; j < maps[i].length; j++) ptsB.addLast (atoms[maps[i][j]]);


return 0;
}var lowestStdDev = 3.4028235E38;
var mapB = null;
for (var i = 0; i < maps.length; i++) {
ptsB.clear ();
for (var j = 0; j < maps[i].length; j++) ptsB.addLast (atoms[maps[i][j]]);

var stddev = J.util.Measure.getTransformMatrix4 (ptsA, ptsB, m, null);
J.util.Logger.info ("getSmilesCorrelation stddev=" + stddev);
if (vReturn != null) {
if (stddev < tolerance) {
var bs =  new J.util.BS ();
for (var j = 0; j < maps[i].length; j++) bs.set (maps[i][j]);

vReturn.addLast (bs);
}}if (stddev < lowestStdDev) {
mapB = maps[i];
lowestStdDev = stddev;
}}
for (var i = 0; i < mapB.length; i++) ptsB.addLast (atoms[mapB[i]]);

return lowestStdDev;
} catch (e) {
if (Clazz.exceptionOf (e, Exception)) {
this.evalError (e.toString (), null);
return 0;
} else {
throw e;
}
}
}, "J.util.BS,J.util.BS,~S,J.util.JmolList,J.util.JmolList,J.util.Matrix4f,J.util.JmolList,~B,~B");
$_M(c$, "getSmilesMatches", 
function (pattern, smiles, bsSelected, bsMatch3D, isSmarts, asOneBitset) {
if (this.chk) {
if (asOneBitset) return  new J.util.BS ();
return ["({})"];
}if (pattern.length == 0) {
var isBioSmiles = (!asOneBitset);
var ret = this.viewer.getSmiles (0, 0, bsSelected, isBioSmiles, false, true, true);
if (ret == null) this.evalError (this.viewer.getSmilesMatcher ().getLastException (), null);
return ret;
}var asAtoms = true;
var b;
if (bsMatch3D == null) {
asAtoms = (smiles == null);
if (asAtoms) b = this.viewer.getSmilesMatcher ().getSubstructureSetArray (pattern, this.viewer.modelSet.atoms, this.viewer.getAtomCount (), bsSelected, null, isSmarts, false);
 else b = this.viewer.getSmilesMatcher ().find (pattern, smiles, isSmarts, false);
if (b == null) {
this.showStringPrint (this.viewer.getSmilesMatcher ().getLastException (), false);
if (!asAtoms && !isSmarts) return Integer.$valueOf (-1);
return "?";
}} else {
var vReturn =  new J.util.JmolList ();
var stddev = this.getSmilesCorrelation (bsMatch3D, bsSelected, pattern, null, null, null, vReturn, isSmarts, false);
if (Float.isNaN (stddev)) {
if (asOneBitset) return  new J.util.BS ();
return [];
}this.showString ("RMSD " + stddev + " Angstroms");
b = vReturn.toArray ( new Array (vReturn.size ()));
}if (asOneBitset) {
var bs =  new J.util.BS ();
for (var j = 0; j < b.length; j++) bs.or (b[j]);

if (asAtoms) return bs;
if (!isSmarts) return Integer.$valueOf (bs.cardinality ());
var iarray =  Clazz.newIntArray (bs.cardinality (), 0);
var pt = 0;
for (var i = bs.nextSetBit (0); i >= 0; i = bs.nextSetBit (i + 1)) iarray[pt++] = i + 1;

return iarray;
}var matches =  new Array (b.length);
for (var j = 0; j < b.length; j++) matches[j] = (asAtoms ? J.util.Escape.eBS (b[j]) : J.util.Escape.eBond (b[j]));

return matches;
}, "~S,~S,J.util.BS,J.util.BS,~B,~B");
$_M(c$, "connect", 
($fz = function (index) {
var distances =  Clazz.newFloatArray (2, 0);
var atomSets =  new Array (2);
atomSets[0] = atomSets[1] = this.viewer.getSelectionSet (false);
var radius = NaN;
var color = -2147483648;
var distanceCount = 0;
var bondOrder = 131071;
var bo;
var operation = 1073742026;
var isDelete = false;
var haveType = false;
var haveOperation = false;
var translucency = null;
var translucentLevel = 3.4028235E38;
var isColorOrRadius = false;
var nAtomSets = 0;
var nDistances = 0;
var bsBonds =  new J.util.BS ();
var isBonds = false;
var expression2 = 0;
var ptColor = 0;
var energy = 0;
var addGroup = false;
if (this.slen == 1) {
if (!this.chk) this.viewer.rebondState (this.isStateScript);
return;
}for (var i = index; i < this.slen; ++i) {
switch (this.getToken (i).tok) {
case 1048589:
case 1048588:
this.checkLength (2);
if (!this.chk) this.viewer.rebondState (this.isStateScript);
return;
case 2:
case 3:
if (nAtomSets > 0) {
if (haveType || isColorOrRadius) this.error (23);
bo = J.util.JmolEdge.getBondOrderFromFloat (this.floatParameter (i));
if (bo == 131071) this.error (22);
bondOrder = bo;
haveType = true;
break;
}if (++nDistances > 2) this.error (2);
var dist = this.floatParameter (i);
if (this.tokAt (i + 1) == 269484210) {
dist = -dist / 100;
i++;
}distances[distanceCount++] = dist;
break;
case 10:
case 1048577:
if (nAtomSets > 2 || isBonds && nAtomSets > 0) this.error (2);
if (haveType || isColorOrRadius) this.error (23);
atomSets[nAtomSets++] = this.atomExpressionAt (i);
isBonds = this.isBondSet;
if (nAtomSets == 2) {
var pt = this.iToken;
for (var j = i; j < pt; j++) if (this.tokAt (j) == 1073741824 && this.parameterAsString (j).equals ("_1")) {
expression2 = i;
break;
}
this.iToken = pt;
}i = this.iToken;
break;
case 1087373318:
addGroup = true;
break;
case 1766856708:
var tok = this.tokAt (i + 1);
if (tok != 1073742180 && tok != 1073742074) ptColor = i + 1;
continue;
case 1073742180:
case 1073742074:
if (translucency != null) this.error (22);
isColorOrRadius = true;
translucency = this.parameterAsString (i);
if (this.theTok == 1073742180 && this.isFloatParameter (i + 1)) translucentLevel = this.getTranslucentLevel (++i);
ptColor = i + 1;
break;
case 1074790662:
var isAuto = (this.tokAt (2) == 1073741852);
this.checkLength (isAuto ? 3 : 2);
if (!this.chk) this.viewer.setPdbConectBonding (isAuto, this.isStateScript);
return;
case 1073741830:
case 1073741852:
case 1073741904:
case 1073742025:
case 1073742026:
haveOperation = true;
if (++i != this.slen) this.error (23);
operation = this.theTok;
if (this.theTok == 1073741852 && !(bondOrder == 131071 || bondOrder == 2048 || bondOrder == 515)) this.error (22);
break;
case 1708058:
if (!isColorOrRadius) {
color = 0xFFFFFF;
translucency = "translucent";
translucentLevel = 0.5;
radius = this.viewer.getFloat (570425406);
isColorOrRadius = true;
}if (!haveOperation) operation = 1073742026;
haveOperation = true;
case 1073741824:
case 1076887572:
case 1612189718:
if (i > 0) {
if (ptColor == i) break;
if (this.isColorParam (i)) {
ptColor = -i;
break;
}}var cmd = this.parameterAsString (i);
if ((bo = J.script.ScriptEvaluator.getBondOrderFromString (cmd)) == 131071) {
this.error (22);
}if (haveType) this.error (18);
haveType = true;
switch (bo) {
case 33:
switch (this.tokAt (i + 1)) {
case 3:
bo = J.script.ScriptEvaluator.getPartialBondOrderFromFloatEncodedInt (this.st[++i].intValue);
break;
case 2:
bo = this.intParameter (++i);
break;
}
break;
case 2048:
if (this.tokAt (i + 1) == 2) {
bo = (this.intParameter (++i) << 11);
energy = this.floatParameter (++i);
}break;
}
bondOrder = bo;
break;
case 1666189314:
radius = this.floatParameter (++i);
isColorOrRadius = true;
break;
case 1048587:
case 12291:
if (++i != this.slen) this.error (23);
operation = 12291;
isDelete = true;
isColorOrRadius = false;
break;
default:
ptColor = i;
break;
}
if (i > 0) {
if (ptColor == -i || ptColor == i && this.isColorParam (i)) {
color = this.getArgbParam (i);
i = this.iToken;
isColorOrRadius = true;
} else if (ptColor == i) {
this.error (22);
}}}
if (this.chk) return;
if (distanceCount < 2) {
if (distanceCount == 0) distances[0] = 1.0E8;
distances[1] = distances[0];
distances[0] = 0.1;
}if (translucency != null || !Float.isNaN (radius) || color != -2147483648) {
if (!haveType) bondOrder = 65535;
if (!haveOperation) operation = 1073742025;
}var nNew = 0;
var nModified = 0;
var result;
if (expression2 > 0) {
var bs =  new J.util.BS ();
this.definedAtomSets.put ("_1", bs);
var bs0 = atomSets[0];
for (var atom1 = bs0.nextSetBit (0); atom1 >= 0; atom1 = bs0.nextSetBit (atom1 + 1)) {
bs.set (atom1);
result = this.viewer.makeConnections (distances[0], distances[1], bondOrder, operation, bs, this.atomExpressionAt (expression2), bsBonds, isBonds, false, 0);
nNew += Math.abs (result[0]);
nModified += result[1];
bs.clear (atom1);
}
} else {
result = this.viewer.makeConnections (distances[0], distances[1], bondOrder, operation, atomSets[0], atomSets[1], bsBonds, isBonds, addGroup, energy);
nNew += Math.abs (result[0]);
nModified += result[1];
}if (isDelete) {
if (!(this.tQuiet || this.scriptLevel > this.scriptReportingLevel)) this.scriptStatusOrBuffer (J.i18n.GT._ ("{0} connections deleted", nModified));
return;
}if (isColorOrRadius) {
this.viewer.selectBonds (bsBonds);
if (!Float.isNaN (radius)) this.setShapeSizeBs (1, Math.round (radius * 2000), null);
if (color != -2147483648) this.setShapePropertyBs (1, "color", Integer.$valueOf (color), bsBonds);
if (translucency != null) {
if (translucentLevel == 3.4028235E38) translucentLevel = this.viewer.getFloat (570425354);
this.setShapeProperty (1, "translucentLevel", Float.$valueOf (translucentLevel));
this.setShapePropertyBs (1, "translucency", translucency, bsBonds);
}this.viewer.selectBonds (null);
}if (!(this.tQuiet || this.scriptLevel > this.scriptReportingLevel)) this.scriptStatusOrBuffer (J.i18n.GT._ ("{0} new bonds; {1} modified", [Integer.$valueOf (nNew), Integer.$valueOf (nModified)]));
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "getTranslucentLevel", 
($fz = function (i) {
var f = this.floatParameter (i);
return (this.theTok == 2 && f > 0 && f < 9 ? f + 1 : f);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "getProperty", 
($fz = function () {
if (this.chk) return;
var retValue = "";
var property = this.optParameterAsString (1);
var name = property;
if (name.indexOf (".") >= 0) name = name.substring (0, name.indexOf ("."));
if (name.indexOf ("[") >= 0) name = name.substring (0, name.indexOf ("["));
var propertyID = this.viewer.getPropertyNumber (name);
var param = this.optParameterAsString (2);
var tok = this.tokAt (2);
var bs = (tok == 1048577 || tok == 10 ? this.atomExpressionAt (2) : null);
if (property.length > 0 && propertyID < 0) {
property = "";
param = "";
} else if (propertyID >= 0 && this.slen < 3) {
param = this.viewer.getDefaultPropertyParam (propertyID);
if (param.equals ("(visible)")) {
this.viewer.setModelVisibility ();
bs = this.viewer.getVisibleSet ();
}} else if (propertyID == this.viewer.getPropertyNumber ("fileContents")) {
for (var i = 3; i < this.slen; i++) param += this.parameterAsString (i);

}retValue = this.viewer.getProperty ("readable", property, (bs == null ? param : bs));
this.showString (retValue);
}, $fz.isPrivate = true, $fz));
$_M(c$, "background", 
($fz = function (i) {
this.getToken (i);
var argb;
if (this.theTok == 1073741979) {
var file = this.parameterAsString (this.checkLast (++i));
if (!this.chk && !file.equalsIgnoreCase ("none") && file.length > 0) this.viewer.loadImage (file, null);
return;
}if (this.isColorParam (i) || this.theTok == 1048587) {
argb = this.getArgbParamLast (i, true);
if (this.chk) return;
this.setObjectArgb ("background", argb);
this.viewer.setBackgroundImage (null, null);
return;
}var iShape = this.getShapeType (this.theTok);
this.colorShape (iShape, i + 1, true);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "center", 
($fz = function (i) {
if (this.slen == 1) {
this.viewer.setNewRotationCenter (null);
return;
}var center = this.centerParameter (i);
if (center == null) this.error (22);
if (!this.chk) this.viewer.setNewRotationCenter (center);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "setObjectProperty", 
($fz = function () {
var s = "";
var id = this.getShapeNameParameter (2);
var data = [id, null];
if (this.chk) return "";
var iTok = this.iToken;
var tokCommand = this.tokAt (0);
var isWild = J.util.TextFormat.isWild (id);
for (var iShape = 17; ; ) {
if (iShape != 27 && this.getShapePropertyData (iShape, "checkID", data)) {
this.setShapeProperty (iShape, "thisID", id);
switch (tokCommand) {
case 12291:
this.setShapeProperty (iShape, "delete", null);
break;
case 12294:
case 1610625028:
this.setShapeProperty (iShape, "hidden", tokCommand == 1610625028 ? Boolean.FALSE : Boolean.TRUE);
break;
case 4148:
s += this.getShapeProperty (iShape, "command") + "\n";
break;
case 1766856708:
this.colorShape (iShape, iTok + 1, false);
break;
}
if (!isWild) break;
}if (iShape == 17) iShape = 31;
if (--iShape < 22) break;
}
return s;
}, $fz.isPrivate = true, $fz));
$_M(c$, "color", 
($fz = function () {
var i = 1;
if (this.isColorParam (1)) {
this.theTok = 1141899265;
} else {
var argb = 0;
i = 2;
var tok = this.getToken (1).tok;
switch (tok) {
case 1048583:
this.setObjectProperty ();
return;
case 1087373315:
case 3145730:
case 1087373316:
case 1073741946:
case 1632634889:
case 1087373318:
case 1114638346:
case 1087373322:
case 1073741992:
case 1095761934:
case 1073742030:
case 1048587:
case 1073742074:
case 1112541196:
case 1095761935:
case 1716520973:
case 1073742116:
case 1113200651:
case 1073742144:
case 1112539148:
case 1641025539:
case 1112539149:
case 1112541199:
case 1073742180:
case 1073742186:
case 1649412112:
this.theTok = 1141899265;
i = 1;
break;
case 4:
i = 1;
var strColor = this.stringParameter (i++);
if (this.isArrayParameter (i)) {
strColor = strColor += "=" + J.script.SV.sValue (J.script.SV.getVariableAS (this.stringParameterSet (i))).$replace ('\n', ' ');
i = this.iToken + 1;
}var isTranslucent = (this.tokAt (i) == 1073742180);
if (!this.chk) this.viewer.setPropertyColorScheme (strColor, isTranslucent, true);
if (isTranslucent) ++i;
if (this.tokAt (i) == 1073742114 || this.tokAt (i) == 1073741826) {
var min = this.floatParameter (++i);
var max = this.floatParameter (++i);
if (!this.chk) this.viewer.setCurrentColorRange (min, max);
}return;
case 1073742114:
case 1073741826:
var min = this.floatParameter (2);
var max = this.floatParameter (this.checkLast (3));
if (!this.chk) this.viewer.setCurrentColorRange (min, max);
return;
case 1610616835:
argb = this.getArgbParamLast (2, true);
if (!this.chk) this.setObjectArgb ("background", argb);
return;
case 10:
case 1048577:
i = -1;
this.theTok = 1141899265;
break;
case 1073742134:
argb = this.getArgbParamLast (2, false);
if (!this.chk) this.viewer.setRubberbandArgb (argb);
return;
case 536870920:
case 1611141171:
i = 2;
if (this.tokAt (2) == 1073742074) i++;
argb = this.getArgbParamLast (i, true);
if (this.chk) return;
this.sm.loadShape (8);
this.setShapeProperty (8, (tok == 1611141171 ? "argbSelection" : "argbHighlight"), Integer.$valueOf (argb));
return;
case 1611272194:
case 1679429641:
case 1614417948:
case 1073741824:
case 1613758476:
var str = this.parameterAsString (1);
if (this.checkToken (2)) {
switch (this.getToken (2).tok) {
case 1073742116:
argb = 1073742116;
break;
case 1048587:
case 1073741992:
argb = 1073741992;
break;
default:
argb = this.getArgbParam (2);
}
}if (argb == 0) this.error (9);
this.checkLast (this.iToken);
if (str.equalsIgnoreCase ("axes") || J.viewer.StateManager.getObjectIdFromName (str) >= 0) {
this.setObjectArgb (str, argb);
return;
}if (this.changeElementColor (str, argb)) return;
this.error (22);
break;
case 135180:
case 135402505:
this.setShapeProperty (J.viewer.JC.shapeTokenIndex (tok), "thisID", "+PREVIOUS_MESH+");
break;
}
}this.colorShape (this.getShapeType (this.theTok), i, false);
}, $fz.isPrivate = true, $fz));
$_M(c$, "changeElementColor", 
($fz = function (str, argb) {
for (var i = J.util.Elements.elementNumberMax; --i >= 0; ) {
if (str.equalsIgnoreCase (J.util.Elements.elementNameFromNumber (i))) {
if (!this.chk) this.viewer.setElementArgb (i, argb);
return true;
}}
for (var i = J.util.Elements.altElementMax; --i >= 0; ) {
if (str.equalsIgnoreCase (J.util.Elements.altElementNameFromIndex (i))) {
if (!this.chk) this.viewer.setElementArgb (J.util.Elements.altElementNumberFromIndex (i), argb);
return true;
}}
if (str.charAt (0) != '_') return false;
for (var i = J.util.Elements.elementNumberMax; --i >= 0; ) {
if (str.equalsIgnoreCase ("_" + J.util.Elements.elementSymbolFromNumber (i))) {
if (!this.chk) this.viewer.setElementArgb (i, argb);
return true;
}}
for (var i = J.util.Elements.altElementMax; --i >= 4; ) {
if (str.equalsIgnoreCase ("_" + J.util.Elements.altElementSymbolFromIndex (i))) {
if (!this.chk) this.viewer.setElementArgb (J.util.Elements.altElementNumberFromIndex (i), argb);
return true;
}if (str.equalsIgnoreCase ("_" + J.util.Elements.altIsotopeSymbolFromIndex (i))) {
if (!this.chk) this.viewer.setElementArgb (J.util.Elements.altElementNumberFromIndex (i), argb);
return true;
}}
return false;
}, $fz.isPrivate = true, $fz), "~S,~N");
$_M(c$, "colorShape", 
($fz = function (shapeType, index, isBackground) {
var translucency = null;
var colorvalue = null;
var colorvalue1 = null;
var bs = null;
var prefix = "";
var isColor = false;
var isIsosurface = (shapeType == 24 || shapeType == 25);
var typeMask = 0;
var doClearBondSet = false;
var translucentLevel = 3.4028235E38;
if (index < 0) {
bs = this.atomExpressionAt (-index);
index = this.iToken + 1;
if (this.isBondSet) {
doClearBondSet = true;
shapeType = 1;
}}if (isBackground) this.getToken (index);
 else if ((isBackground = (this.getToken (index).tok == 1610616835)) == true) this.getToken (++index);
if (isBackground) prefix = "bg";
 else if (isIsosurface) {
switch (this.theTok) {
case 1073742018:
this.getToken (++index);
prefix = "mesh";
break;
case 1073742094:
var argb = this.getArgbParamOrNone (++index, false);
colorvalue1 = (argb == 0 ? null : Integer.$valueOf (argb));
this.getToken (index = this.iToken + 1);
break;
case 10:
case 1048577:
if (Clazz.instanceOf (this.theToken.value, J.modelset.Bond.BondSet)) {
bs = this.theToken.value;
prefix = "vertex";
} else {
bs = this.atomExpressionAt (index);
prefix = "atom";
}translucentLevel = 1.4E-45;
this.getToken (index = this.iToken + 1);
break;
}
}if (!this.chk && shapeType == 27 && !this.mo (true)) return;
var isTranslucent = (this.theTok == 1073742180);
if (isTranslucent || this.theTok == 1073742074) {
if (translucentLevel == 1.4E-45) this.error (22);
translucency = this.parameterAsString (index++);
if (isTranslucent && this.isFloatParameter (index)) translucentLevel = this.getTranslucentLevel (index++);
}var tok = 0;
if (index < this.slen && this.tokAt (index) != 1048589 && this.tokAt (index) != 1048588) {
isColor = true;
tok = this.getToken (index).tok;
if ((!isIsosurface || this.tokAt (index + 1) != 1074790746) && this.isColorParam (index)) {
var argb = this.getArgbParamOrNone (index, false);
colorvalue = (argb == 0 ? null : Integer.$valueOf (argb));
if (translucency == null && this.tokAt (index = this.iToken + 1) != 0) {
this.getToken (index);
isTranslucent = (this.theTok == 1073742180);
if (isTranslucent || this.theTok == 1073742074) {
translucency = this.parameterAsString (index);
if (isTranslucent && this.isFloatParameter (index + 1)) translucentLevel = this.getTranslucentLevel (++index);
} else if (this.isColorParam (index)) {
argb = this.getArgbParamOrNone (index, false);
colorvalue1 = (argb == 0 ? null : Integer.$valueOf (argb));
}}} else if (shapeType == 26) {
this.iToken--;
} else {
var name = this.parameterAsString (index).toLowerCase ();
var isByElement = (name.indexOf ("byelement") == 0);
var isColorIndex = (isByElement || name.indexOf ("byresidue") == 0);
var pal = (isColorIndex || isIsosurface ? J.constant.EnumPalette.PROPERTY : tok == 1113200651 ? J.constant.EnumPalette.CPK : J.constant.EnumPalette.getPalette (name));
if (pal === J.constant.EnumPalette.UNKNOWN || (pal === J.constant.EnumPalette.TYPE || pal === J.constant.EnumPalette.ENERGY) && shapeType != 2) this.error (22);
var data = null;
var bsSelected = (pal !== J.constant.EnumPalette.PROPERTY && pal !== J.constant.EnumPalette.VARIABLE || !this.viewer.global.rangeSelected ? null : this.viewer.getSelectionSet (false));
if (pal === J.constant.EnumPalette.PROPERTY) {
if (isColorIndex) {
if (!this.chk) {
data = this.getBitsetPropertyFloat (bsSelected, (isByElement ? 1095763976 : 1095761930) | 256, NaN, NaN);
}} else {
if (!isColorIndex && !isIsosurface) index++;
if (name.equals ("property") && J.script.T.tokAttr ((tok = this.getToken (index).tok), 1078984704) && !J.script.T.tokAttr (tok, 1087373312)) {
if (!this.chk) {
data = this.getBitsetPropertyFloat (bsSelected, this.getToken (index++).tok | 256, NaN, NaN);
}}}} else if (pal === J.constant.EnumPalette.VARIABLE) {
index++;
name = this.parameterAsString (index++);
data =  Clazz.newFloatArray (this.viewer.getAtomCount (), 0);
J.util.Parser.parseStringInfestedFloatArray ("" + this.getParameter (name, 4), null, data);
pal = J.constant.EnumPalette.PROPERTY;
}if (pal === J.constant.EnumPalette.PROPERTY) {
var scheme = null;
if (this.tokAt (index) == 4) {
scheme = this.parameterAsString (index++).toLowerCase ();
if (this.isArrayParameter (index)) {
scheme += "=" + J.script.SV.sValue (J.script.SV.getVariableAS (this.stringParameterSet (index))).$replace ('\n', ' ');
index = this.iToken + 1;
}} else if (isIsosurface && this.isColorParam (index)) {
scheme = this.getColorRange (index);
index = this.iToken + 1;
}if (scheme != null && !isIsosurface) {
this.setStringProperty ("propertyColorScheme", (isTranslucent && translucentLevel == 3.4028235E38 ? "translucent " : "") + scheme);
isColorIndex = (scheme.indexOf ("byelement") == 0 || scheme.indexOf ("byresidue") == 0);
}var min = 0;
var max = 3.4028235E38;
if (!isColorIndex && (this.tokAt (index) == 1073741826 || this.tokAt (index) == 1073742114)) {
min = this.floatParameter (index + 1);
max = this.floatParameter (index + 2);
index += 3;
if (min == max && isIsosurface) {
var range = this.getShapeProperty (shapeType, "dataRange");
if (range != null) {
min = range[0];
max = range[1];
}} else if (min == max) {
max = 3.4028235E38;
}}if (!this.chk) {
if (isIsosurface) {
} else if (data == null) {
this.viewer.setCurrentColorRange (name);
} else {
this.viewer.setCurrentColorRangeData (data, bsSelected);
}if (isIsosurface) {
this.checkLength (index);
isColor = false;
var ce = this.viewer.getColorEncoder (scheme);
if (ce == null) return;
ce.isTranslucent = (isTranslucent && translucentLevel == 3.4028235E38);
ce.setRange (min, max, min > max);
if (max == 3.4028235E38) ce.hi = max;
this.setShapeProperty (shapeType, "remapColor", ce);
this.showString (this.getIsosurfaceDataRange (shapeType, ""));
if (translucentLevel == 3.4028235E38) return;
} else if (max != 3.4028235E38) {
this.viewer.setCurrentColorRange (min, max);
}}} else {
index++;
}this.checkLength (index);
colorvalue = pal;
}}if (this.chk || shapeType < 0) return;
switch (shapeType) {
case 4:
typeMask = 32768;
break;
case 2:
typeMask = 30720;
break;
case 3:
typeMask = 256;
break;
case 1:
typeMask = 1023;
break;
default:
typeMask = 0;
}
if (typeMask == 0) {
this.sm.loadShape (shapeType);
if (shapeType == 5) this.setShapeProperty (5, "setDefaults", this.viewer.getNoneSelected ());
} else {
if (bs != null) {
this.viewer.selectBonds (bs);
bs = null;
}shapeType = 1;
this.setShapeProperty (shapeType, "type", Integer.$valueOf (typeMask));
}if (isColor) {
switch (tok) {
case 1112539149:
case 1112539148:
this.viewer.autoCalculate (tok);
break;
case 1112541199:
if (this.viewer.global.rangeSelected) this.viewer.clearBfactorRange ();
break;
case 1087373318:
this.viewer.calcSelectedGroupsCount ();
break;
case 1095761935:
case 1073742030:
this.viewer.calcSelectedMonomersCount ();
break;
case 1095761934:
this.viewer.calcSelectedMoleculesCount ();
break;
}
if (colorvalue1 != null && (isIsosurface || shapeType == 11 || shapeType == 14)) this.setShapeProperty (shapeType, "colorPhase", [colorvalue1, colorvalue]);
 else if (bs == null) this.setShapeProperty (shapeType, prefix + "color", colorvalue);
 else this.setShapePropertyBs (shapeType, prefix + "color", colorvalue, bs);
}if (translucency != null) this.setShapeTranslucency (shapeType, prefix, translucency, translucentLevel, bs);
if (typeMask != 0) this.setShapeProperty (1, "type", Integer.$valueOf (1023));
if (doClearBondSet) this.viewer.selectBonds (null);
if (shapeType == 0) this.viewer.checkInheritedShapes ();
}, $fz.isPrivate = true, $fz), "~N,~N,~B");
$_M(c$, "setShapeTranslucency", 
($fz = function (shapeType, prefix, translucency, translucentLevel, bs) {
if (translucentLevel == 3.4028235E38) translucentLevel = this.viewer.getFloat (570425354);
this.setShapeProperty (shapeType, "translucentLevel", Float.$valueOf (translucentLevel));
if (prefix == null) return;
if (bs == null) this.setShapeProperty (shapeType, prefix + "translucency", translucency);
 else if (!this.chk) this.setShapePropertyBs (shapeType, prefix + "translucency", translucency, bs);
}, $fz.isPrivate = true, $fz), "~N,~S,~S,~N,J.util.BS");
$_M(c$, "cd", 
($fz = function () {
if (this.chk) return;
var dir = (this.slen == 1 ? null : this.parameterAsString (1));
this.showString (this.viewer.cd (dir));
}, $fz.isPrivate = true, $fz));
$_M(c$, "mapProperty", 
($fz = function () {
var bsFrom;
var bsTo;
var property1;
var property2;
var mapKey;
var tokProp1 = 0;
var tokProp2 = 0;
var tokKey = 0;
while (true) {
if (this.tokAt (1) == 1114638350) {
bsFrom = this.viewer.getSelectionSet (false);
bsTo = this.atomExpressionAt (2);
property1 = property2 = "selected";
} else {
bsFrom = this.atomExpressionAt (1);
if (this.tokAt (++this.iToken) != 1048584 || !J.script.T.tokAttr (tokProp1 = this.tokAt (++this.iToken), 1078984704)) break;
property1 = this.parameterAsString (this.iToken);
bsTo = this.atomExpressionAt (++this.iToken);
if (this.tokAt (++this.iToken) != 1048584 || !J.script.T.tokAttr (tokProp2 = this.tokAt (++this.iToken), 2048)) break;
property2 = this.parameterAsString (this.iToken);
}if (J.script.T.tokAttr (tokKey = this.tokAt (this.iToken + 1), 1078984704)) mapKey = this.parameterAsString (++this.iToken);
 else mapKey = J.script.T.nameOf (tokKey = 1095763969);
this.checkLast (this.iToken);
if (this.chk) return;
var bsOut = null;
this.showString ("mapping " + property1.toUpperCase () + " for " + bsFrom.cardinality () + " atoms to " + property2.toUpperCase () + " for " + bsTo.cardinality () + " atoms using " + mapKey.toUpperCase ());
if (J.script.T.tokAttrOr (tokProp1, 1095761920, 1112539136) && J.script.T.tokAttrOr (tokProp2, 1095761920, 1112539136) && J.script.T.tokAttrOr (tokKey, 1095761920, 1112539136)) {
var data1 = this.getBitsetPropertyFloat (bsFrom, tokProp1 | 224, NaN, NaN);
var data2 = this.getBitsetPropertyFloat (bsFrom, tokKey | 224, NaN, NaN);
var data3 = this.getBitsetPropertyFloat (bsTo, tokKey | 224, NaN, NaN);
var isProperty = (tokProp2 == 1716520973);
var dataOut =  Clazz.newFloatArray (isProperty ? this.viewer.getAtomCount () : data3.length, 0);
bsOut =  new J.util.BS ();
if (data1.length == data2.length) {
var ht =  new java.util.Hashtable ();
for (var i = 0; i < data1.length; i++) {
ht.put (Float.$valueOf (data2[i]), Float.$valueOf (data1[i]));
}
var pt = -1;
var nOut = 0;
for (var i = 0; i < data3.length; i++) {
pt = bsTo.nextSetBit (pt + 1);
var F = ht.get (Float.$valueOf (data3[i]));
if (F == null) continue;
bsOut.set (pt);
dataOut[(isProperty ? pt : nOut)] = F.floatValue ();
nOut++;
}
if (isProperty) this.viewer.setData (property2, [property2, dataOut, bsOut, Integer.$valueOf (0)], this.viewer.getAtomCount (), 0, 0, 2147483647, 0);
 else this.viewer.setAtomProperty (bsOut, tokProp2, 0, 0, null, dataOut, null);
}}if (bsOut == null) {
var format = "{" + mapKey + "=%[" + mapKey + "]}." + property2 + " = %[" + property1 + "]";
var data = this.getBitsetIdent (bsFrom, format, null, false, 2147483647, false);
var sb =  new J.util.SB ();
for (var i = 0; i < data.length; i++) if (data[i].indexOf ("null") < 0) sb.append (data[i]).appendC ('\n');

if (J.util.Logger.debugging) J.util.Logger.info (sb.toString ());
var bsSubset = J.util.BSUtil.copy (this.viewer.getSelectionSubset ());
this.viewer.setSelectionSubset (bsTo);
try {
this.runScript (sb.toString ());
} catch (e$$) {
if (Clazz.exceptionOf (e$$, Exception)) {
var e = e$$;
{
this.viewer.setSelectionSubset (bsSubset);
this.errorStr (-1, "Error: " + e.toString ());
}
} else if (Clazz.exceptionOf (e$$, Error)) {
var er = e$$;
{
this.viewer.setSelectionSubset (bsSubset);
this.errorStr (-1, "Error: " + er.toString ());
}
} else {
throw e$$;
}
}
this.viewer.setSelectionSubset (bsSubset);
}this.showString ("DONE");
return;
}
this.error (22);
}, $fz.isPrivate = true, $fz));
$_M(c$, "data", 
($fz = function () {
var dataString = null;
var dataLabel = null;
var isOneValue = false;
var i;
switch (this.iToken = this.slen) {
case 5:
dataString = this.parameterAsString (2);
case 4:
case 2:
dataLabel = this.parameterAsString (1);
if (dataLabel.equalsIgnoreCase ("clear")) {
if (!this.chk) this.viewer.setData (null, null, 0, 0, 0, 0, 0);
return;
}if ((i = dataLabel.indexOf ("@")) >= 0) {
dataString = "" + this.getParameter (dataLabel.substring (i + 1), 4);
dataLabel = dataLabel.substring (0, i).trim ();
} else if (dataString == null && (i = dataLabel.indexOf (" ")) >= 0) {
dataString = dataLabel.substring (i + 1).trim ();
dataLabel = dataLabel.substring (0, i).trim ();
isOneValue = true;
}break;
default:
this.error (2);
}
var dataType = dataLabel + " ";
dataType = dataType.substring (0, dataType.indexOf (" ")).toLowerCase ();
if (dataType.equals ("model") || dataType.equals ("append")) {
this.load ();
return;
}if (this.chk) return;
var isDefault = (dataLabel.toLowerCase ().indexOf ("(default)") >= 0);
this.$data =  new Array (4);
if (dataType.equals ("element_vdw")) {
this.$data[0] = dataType;
this.$data[1] = dataString.$replace (';', '\n');
var n = J.util.Elements.elementNumberMax;
var eArray =  Clazz.newIntArray (n + 1, 0);
for (var ie = 1; ie <= n; ie++) eArray[ie] = ie;

this.$data[2] = eArray;
this.$data[3] = Integer.$valueOf (0);
this.viewer.setData ("element_vdw", this.$data, n, 0, 0, 0, 0);
return;
}if (dataType.equals ("connect_atoms")) {
this.viewer.connect (J.util.Parser.parseFloatArray2d (dataString));
return;
}if (dataType.indexOf ("ligand_") == 0) {
this.viewer.setLigandModel (dataLabel.substring (7), dataString.trim ());
return;
}if (dataType.indexOf ("data2d_") == 0) {
this.$data[0] = dataLabel;
this.$data[1] = J.util.Parser.parseFloatArray2d (dataString);
this.$data[3] = Integer.$valueOf (2);
this.viewer.setData (dataLabel, this.$data, 0, 0, 0, 0, 0);
return;
}if (dataType.indexOf ("data3d_") == 0) {
this.$data[0] = dataLabel;
this.$data[1] = J.util.Parser.parseFloatArray3d (dataString);
this.$data[3] = Integer.$valueOf (3);
this.viewer.setData (dataLabel, this.$data, 0, 0, 0, 0, 0);
return;
}var tokens = J.util.Parser.getTokens (dataLabel);
if (dataType.indexOf ("property_") == 0 && !(tokens.length == 2 && tokens[1].equals ("set"))) {
var bs = this.viewer.getSelectionSet (false);
this.$data[0] = dataType;
var atomNumberField = (isOneValue ? 0 : (this.viewer.getParameter ("propertyAtomNumberField")).intValue ());
var atomNumberFieldColumnCount = (isOneValue ? 0 : (this.viewer.getParameter ("propertyAtomNumberColumnCount")).intValue ());
var propertyField = (isOneValue ? -2147483648 : (this.viewer.getParameter ("propertyDataField")).intValue ());
var propertyFieldColumnCount = (isOneValue ? 0 : (this.viewer.getParameter ("propertyDataColumnCount")).intValue ());
if (!isOneValue && dataLabel.indexOf (" ") >= 0) {
if (tokens.length == 3) {
dataLabel = tokens[0];
atomNumberField = J.util.Parser.parseInt (tokens[1]);
propertyField = J.util.Parser.parseInt (tokens[2]);
}if (tokens.length == 5) {
dataLabel = tokens[0];
atomNumberField = J.util.Parser.parseInt (tokens[1]);
atomNumberFieldColumnCount = J.util.Parser.parseInt (tokens[2]);
propertyField = J.util.Parser.parseInt (tokens[3]);
propertyFieldColumnCount = J.util.Parser.parseInt (tokens[4]);
}}if (atomNumberField < 0) atomNumberField = 0;
if (propertyField < 0) propertyField = 0;
var atomCount = this.viewer.getAtomCount ();
var atomMap = null;
var bsTemp = J.util.BSUtil.newBitSet (atomCount);
if (atomNumberField > 0) {
atomMap =  Clazz.newIntArray (atomCount + 2, 0);
for (var j = 0; j <= atomCount; j++) atomMap[j] = -1;

for (var j = bs.nextSetBit (0); j >= 0; j = bs.nextSetBit (j + 1)) {
var atomNo = this.viewer.getAtomNumber (j);
if (atomNo > atomCount + 1 || atomNo < 0 || bsTemp.get (atomNo)) continue;
bsTemp.set (atomNo);
atomMap[atomNo] = j;
}
this.$data[2] = atomMap;
} else {
this.$data[2] = J.util.BSUtil.copy (bs);
}this.$data[1] = dataString;
this.$data[3] = Integer.$valueOf (0);
this.viewer.setData (dataType, this.$data, atomCount, atomNumberField, atomNumberFieldColumnCount, propertyField, propertyFieldColumnCount);
return;
}var userType = J.modelset.AtomCollection.getUserSettableType (dataType);
if (userType >= 0) {
this.viewer.setAtomData (userType, dataType, dataString, isDefault);
return;
}this.$data[0] = dataLabel;
this.$data[1] = dataString;
this.$data[3] = Integer.$valueOf (0);
this.viewer.setData (dataType, this.$data, 0, 0, 0, 0, 0);
}, $fz.isPrivate = true, $fz));
$_M(c$, "define", 
($fz = function () {
if (this.slen < 3 || !(Clazz.instanceOf (this.getToken (1).value, String))) this.error (22);
var setName = (this.getToken (1).value).toLowerCase ();
if (J.util.Parser.parseInt (setName) != -2147483648) this.error (22);
if (this.chk) return;
var isSite = setName.startsWith ("site_");
var isDynamic = (setName.indexOf ("dynamic_") == 0);
if (isDynamic || isSite) {
var code =  new Array (this.slen);
for (var i = this.slen; --i >= 0; ) code[i] = this.st[i];

this.definedAtomSets.put ("!" + (isSite ? setName : setName.substring (8)), code);
} else {
var bs = this.atomExpressionAt (2);
this.definedAtomSets.put (setName, bs);
if (!this.chk) this.viewer.setUserVariable ("@" + setName, J.script.SV.newVariable (10, bs));
}}, $fz.isPrivate = true, $fz));
$_M(c$, "echo", 
($fz = function (index, id, isImage) {
if (this.chk) return;
var text = this.optParameterAsString (index);
if (this.viewer.getEchoStateActive ()) {
if (isImage) {
this.viewer.loadImage (text, id);
return;
} else if (text.startsWith ("\1")) {
text = text.substring (1);
isImage = true;
}if (text != null) this.setShapeProperty (30, "text", text);
}if (!isImage && this.viewer.getRefreshing ()) this.showString (this.viewer.formatText (text));
}, $fz.isPrivate = true, $fz), "~N,~S,~B");
$_M(c$, "message", 
($fz = function () {
var text = this.parameterAsString (this.checkLast (1));
if (this.chk) return;
var s = this.viewer.formatText (text);
if (this.outputBuffer == null) this.viewer.showMessage (s);
if (!s.startsWith ("_")) this.scriptStatusOrBuffer (s);
}, $fz.isPrivate = true, $fz));
$_M(c$, "log", 
($fz = function () {
if (this.slen == 1) this.error (2);
if (this.chk) return;
var s = this.parameterExpressionString (1, 0);
if (this.tokAt (1) == 1048588) this.setStringProperty ("logFile", "");
 else this.viewer.log (s);
}, $fz.isPrivate = true, $fz));
$_M(c$, "label", 
($fz = function (index) {
if (this.chk) return;
this.sm.loadShape (5);
var strLabel = null;
switch (this.getToken (index).tok) {
case 1048589:
strLabel = this.viewer.getStandardLabelFormat (0);
break;
case 1048588:
break;
case 12294:
case 1610625028:
this.setShapeProperty (5, "display", this.theTok == 1610625028 ? Boolean.TRUE : Boolean.FALSE);
return;
default:
strLabel = this.parameterAsString (index);
}
this.sm.setLabel (strLabel, this.viewer.getSelectionSet (false));
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "hover", 
($fz = function () {
if (this.chk) return;
var strLabel = this.parameterAsString (1);
if (strLabel.equalsIgnoreCase ("on")) strLabel = "%U";
 else if (strLabel.equalsIgnoreCase ("off")) strLabel = null;
this.viewer.setHoverLabel (strLabel);
}, $fz.isPrivate = true, $fz));
$_M(c$, "load", 
($fz = function () {
var doLoadFiles = (!this.chk || this.isCmdLine_C_Option);
var isAppend = false;
var isInline = false;
var isSmiles = false;
var isData = false;
var bsModels;
var i = (this.tokAt (0) == 135270407 ? 0 : 1);
var appendNew = this.viewer.getBoolean (603979792);
var filter = null;
var firstLastSteps = null;
var modelCount0 = this.viewer.getModelCount () - (this.viewer.getFileName ().equals ("zapped") ? 1 : 0);
var atomCount0 = this.viewer.getAtomCount ();
var loadScript =  new J.util.SB ().append ("load");
var nFiles = 1;
var htParams =  new java.util.Hashtable ();
if (this.isStateScript) {
htParams.put ("isStateScript", Boolean.TRUE);
if (this.forceNoAddHydrogens) htParams.put ("doNotAddHydrogens", Boolean.TRUE);
}var modelName = null;
var filenames = null;
var tempFileInfo = null;
var errMsg = null;
var sOptions = "";
var tokType = 0;
var tok;
if (this.slen == 1) {
i = 0;
} else {
modelName = this.parameterAsString (i);
if (this.slen == 2 && !this.chk) {
if (modelName.endsWith (".spt") || modelName.endsWith (".png") || modelName.endsWith (".pngj")) {
this.script (0, modelName);
return;
}}switch (tok = this.tokAt (i)) {
case 1073742015:
var m = this.parameterAsString (this.checkLast (2));
if (!this.chk) this.viewer.setMenu (m, true);
return;
case 135270407:
isData = true;
loadScript.append (" /*data*/ data");
var key = this.stringParameter (++i).toLowerCase ();
loadScript.append (" ").append (J.util.Escape.eS (key));
isAppend = key.startsWith ("append");
var strModel = (key.indexOf ("@") >= 0 ? "" + this.getParameter (key.substring (key.indexOf ("@") + 1), 4) : this.parameterAsString (++i));
strModel = J.viewer.Viewer.fixInlineString (strModel, this.viewer.getInlineChar ());
htParams.put ("fileData", strModel);
htParams.put ("isData", Boolean.TRUE);
loadScript.appendC ('\n');
loadScript.append (strModel);
if (key.indexOf ("@") < 0) {
loadScript.append (" end ").append (J.util.Escape.eS (key));
i += 2;
}break;
case 1073741839:
isAppend = true;
loadScript.append (" append");
modelName = this.optParameterAsString (++i);
tok = J.script.T.getTokFromName (modelName);
break;
case 1073741824:
i++;
loadScript.append (" " + modelName);
tokType = (tok == 1073741824 && J.util.Parser.isOneOf (modelName.toLowerCase (), "xyz;vxyz;vibration;temperature;occupancy;partialcharge") ? J.script.T.getTokFromName (modelName) : 0);
if (tokType != 0) {
htParams.put ("atomDataOnly", Boolean.TRUE);
htParams.put ("modelNumber", Integer.$valueOf (1));
if (tokType == 4166) tokType = 1146095631;
tempFileInfo = this.viewer.getFileInfo ();
isAppend = true;
}}
switch (tok) {
case 1229984263:
case 1073741983:
isInline = (tok == 1073741983);
i++;
loadScript.append (" " + modelName);
break;
case 135267336:
isSmiles = true;
i++;
break;
case 4156:
htParams.put ("async", Boolean.TRUE);
i++;
break;
case 536870926:
case 1095766028:
i++;
loadScript.append (" " + modelName);
if (tok == 536870926) htParams.put ("isTrajectory", Boolean.TRUE);
if (this.isPoint3f (i)) {
var pt = this.getPoint3f (i, false);
i = this.iToken + 1;
htParams.put ("firstLastStep", [Clazz.floatToInt (pt.x), Clazz.floatToInt (pt.y), Clazz.floatToInt (pt.z)]);
loadScript.append (" " + J.util.Escape.eP (pt));
} else if (this.tokAt (i) == 10) {
bsModels = this.getToken (i++).value;
htParams.put ("bsModels", bsModels);
loadScript.append (" " + J.util.Escape.eBS (bsModels));
} else {
htParams.put ("firstLastStep", [0, -1, 1]);
}break;
case 1073741824:
break;
default:
modelName = "fileset";
}
if (this.getToken (i).tok != 4) this.error (16);
}var filePt = i;
var localName = null;
if (this.tokAt (filePt + 1) == 1073741848) {
localName = this.stringParameter (i = i + 2);
if (this.viewer.getPathForAllFiles () !== "") {
localName = null;
filePt = i;
}}var filename = null;
var appendedData = null;
var appendedKey = null;
if (this.slen == i + 1) {
if (i == 0 || (filename = this.parameterAsString (filePt)).length == 0) filename = this.viewer.getFullPathName ();
if (filename == null) {
this.zap (false);
return;
}if (isSmiles) {
filename = "$" + filename;
} else if (!isInline) {
if (filename.indexOf ("[]") >= 0) return;
if (filename.indexOf ("[") == 0) {
filenames = J.util.Escape.unescapeStringArray (filename);
if (filenames != null) {
if (i == 1) loadScript.append (" files");
if (loadScript.indexOf (" files") < 0) this.error (22);
for (var j = 0; j < filenames.length; j++) loadScript.append (" /*file*/").append (J.util.Escape.eS (filenames[j]));

}}}} else if (this.getToken (i + 1).tok == 1073742010 || this.theTok == 2 || this.theTok == 7 || this.theTok == 269484096 || this.theTok == 1073742195 || this.theTok == 1048586 || this.theTok == 8 || this.theTok == 1073742080 || this.theTok == 1073741877 || this.theTok == 1073742163 || this.theTok == 1073742114 || this.theTok == 1073742152 || this.theTok == 1614417948 || this.theTok == 1073742066 || this.theTok == 1073741940 && this.tokAt (i + 3) != 1048582 || this.theTok == 1073741839 || this.theTok == 1073741824 && this.tokAt (i + 3) != 1048582) {
if ((filename = this.parameterAsString (filePt)).length == 0 && (filename = this.viewer.getFullPathName ()) == null) {
this.zap (false);
return;
}if (filePt == i) i++;
if (filename.indexOf ("[]") >= 0) return;
if ((tok = this.tokAt (i)) == 1073742010) {
var manifest = this.stringParameter (++i);
htParams.put ("manifest", manifest);
sOptions += " MANIFEST " + J.util.Escape.eS (manifest);
tok = this.tokAt (++i);
}switch (tok) {
case 2:
var n = this.intParameter (i);
sOptions += " " + n;
if (n < 0) htParams.put ("vibrationNumber", Integer.$valueOf (-n));
 else htParams.put ("modelNumber", Integer.$valueOf (n));
tok = this.tokAt (++i);
break;
case 7:
case 269484096:
case 1073742195:
var data = this.floatParameterSet (i, 1, 2147483647);
i = this.iToken;
var bs =  new J.util.BS ();
for (var j = 0; j < data.length; j++) if (data[j] >= 1 && data[j] == Clazz.floatToInt (data[j])) bs.set (Clazz.floatToInt (data[j]) - 1);

htParams.put ("bsModels", bs);
var iArray =  Clazz.newIntArray (bs.cardinality (), 0);
for (var pt = 0, j = bs.nextSetBit (0); j >= 0; j = bs.nextSetBit (j + 1)) iArray[pt++] = j + 1;

sOptions += " " + J.util.Escape.eAI (iArray);
tok = this.tokAt (i);
break;
}
var lattice = null;
if (tok == 1048586 || tok == 8) {
lattice = this.getPoint3f (i, false);
i = this.iToken + 1;
tok = this.tokAt (i);
}switch (tok) {
case 1073742080:
case 1073741877:
case 1073742163:
case 1073742114:
case 1073742152:
case 1614417948:
if (lattice == null) lattice = J.util.P3.new3 (555, 555, -1);
this.iToken = i - 1;
}
var offset = null;
if (lattice != null) {
htParams.put ("lattice", lattice);
i = this.iToken + 1;
sOptions += " {" + Clazz.floatToInt (lattice.x) + " " + Clazz.floatToInt (lattice.y) + " " + Clazz.floatToInt (lattice.z) + "}";
if (this.tokAt (i) == 1073742080) {
htParams.put ("packed", Boolean.TRUE);
sOptions += " PACKED";
i++;
}if (this.tokAt (i) == 1073741877) {
htParams.put ("centroid", Boolean.TRUE);
sOptions += " CENTROID";
i++;
if (this.tokAt (i) == 1073742080 && !htParams.containsKey ("packed")) {
htParams.put ("packed", Boolean.TRUE);
sOptions += " PACKED";
i++;
}}if (this.tokAt (i) == 1073742163) {
var supercell;
if (this.isPoint3f (++i)) {
var pt = this.getPoint3f (i, false);
if (pt.x != Clazz.floatToInt (pt.x) || pt.y != Clazz.floatToInt (pt.y) || pt.z != Clazz.floatToInt (pt.z) || pt.x < 1 || pt.y < 1 || pt.z < 1) {
this.iToken = i;
this.error (22);
}supercell = pt;
i = this.iToken + 1;
} else {
supercell = this.stringParameter (i++);
}htParams.put ("supercell", supercell);
}var distance = 0;
if (this.tokAt (i) == 1073742114) {
i++;
distance = this.floatParameter (i++);
sOptions += " range " + distance;
}htParams.put ("symmetryRange", Float.$valueOf (distance));
var spacegroup = null;
var sg;
var iGroup = -2147483648;
if (this.tokAt (i) == 1073742152) {
++i;
spacegroup = J.util.TextFormat.simpleReplace (this.parameterAsString (i++), "''", "\"");
sOptions += " spacegroup " + J.util.Escape.eS (spacegroup);
if (spacegroup.equalsIgnoreCase ("ignoreOperators")) {
iGroup = -999;
} else {
if (spacegroup.length == 0) {
sg = this.viewer.getCurrentUnitCell ();
if (sg != null) spacegroup = sg.getSpaceGroupName ();
} else {
if (spacegroup.indexOf (",") >= 0) if ((lattice.x < 9 && lattice.y < 9 && lattice.z == 0)) spacegroup += "#doNormalize=0";
}htParams.put ("spaceGroupName", spacegroup);
iGroup = -2;
}}var fparams = null;
if (this.tokAt (i) == 1614417948) {
++i;
if (this.optParameterAsString (i).length == 0) {
sg = this.viewer.getCurrentUnitCell ();
if (sg != null) {
fparams = sg.getUnitCellAsArray (true);
offset = sg.getCartesianOffset ();
}} else {
fparams = this.floatParameterSet (i, 6, 9);
}if (fparams == null || fparams.length != 6 && fparams.length != 9) this.error (22);
sOptions += " unitcell {";
for (var j = 0; j < fparams.length; j++) sOptions += (j == 0 ? "" : " ") + fparams[j];

sOptions += "}";
htParams.put ("unitcell", fparams);
if (iGroup == -2147483648) iGroup = -1;
}i = this.iToken + 1;
if (iGroup != -2147483648) htParams.put ("spaceGroupIndex", Integer.$valueOf (iGroup));
}if (offset != null) this.coordinatesAreFractional = false;
 else if (this.tokAt (i) == 1073742066) offset = this.getPoint3f (++i, true);
if (offset != null) {
if (this.coordinatesAreFractional) {
offset.setT (this.fractionalPoint);
htParams.put ("unitCellOffsetFractional", (this.coordinatesAreFractional ? Boolean.TRUE : Boolean.FALSE));
sOptions += " offset {" + offset.x + " " + offset.y + " " + offset.z + "/1}";
} else {
sOptions += " offset " + J.util.Escape.eP (offset);
}htParams.put ("unitCellOffset", offset);
i = this.iToken + 1;
}if (this.tokAt (i) == 1073741839) {
if (this.tokAt (++i) == 135270407) {
i += 2;
appendedData = this.getToken (i++).value;
appendedKey = this.stringParameter (++i);
++i;
} else {
appendedKey = this.stringParameter (i++);
appendedData = this.stringParameter (i++);
}htParams.put (appendedKey, appendedData);
}if (this.tokAt (i) == 1073741940) filter = this.stringParameter (++i);
} else {
if (i == 1) {
i++;
loadScript.append (" " + modelName);
}var pt = null;
var bs = null;
var fNames =  new J.util.JmolList ();
while (i < this.slen) {
switch (this.tokAt (i)) {
case 1073741940:
filter = this.stringParameter (++i);
++i;
continue;
case 1048582:
htParams.remove ("isTrajectory");
if (firstLastSteps == null) {
firstLastSteps =  new J.util.JmolList ();
pt = J.util.P3.new3 (0, -1, 1);
}if (this.isPoint3f (++i)) {
pt = this.getPoint3f (i, false);
i = this.iToken + 1;
} else if (this.tokAt (i) == 10) {
bs = this.getToken (i).value;
pt = null;
i = this.iToken + 1;
}break;
case 1073741824:
this.error (22);
}
fNames.addLast (filename = this.parameterAsString (i++));
if (pt != null) {
firstLastSteps.addLast ([Clazz.floatToInt (pt.x), Clazz.floatToInt (pt.y), Clazz.floatToInt (pt.z)]);
loadScript.append (" COORD " + J.util.Escape.eP (pt));
} else if (bs != null) {
firstLastSteps.addLast (bs);
loadScript.append (" COORD " + J.util.Escape.eBS (bs));
}loadScript.append (" /*file*/$FILENAME" + fNames.size () + "$");
}
if (firstLastSteps != null) {
htParams.put ("firstLastSteps", firstLastSteps);
}nFiles = fNames.size ();
filenames =  new Array (nFiles);
for (var j = 0; j < nFiles; j++) filenames[j] = fNames.get (j);

filename = "fileSet";
}if (!doLoadFiles) return;
if (appendedData != null) {
sOptions += " APPEND data \"" + appendedKey + "\"\n" + appendedData + (appendedData.endsWith ("\n") ? "" : "\n") + "end \"" + appendedKey + "\"";
}if (filter == null) filter = this.viewer.getDefaultLoadFilter ();
if (filter.length > 0) {
htParams.put ("filter", filter);
if (filter.equalsIgnoreCase ("2d")) filter = "2D-noMin";
sOptions += " FILTER " + J.util.Escape.eS (filter);
}var isVariable = false;
if (filenames == null) {
if (isInline) {
htParams.put ("fileData", filename);
} else if (filename.startsWith ("@") && filename.length > 1) {
isVariable = true;
var s = this.getStringParameter (filename.substring (1), false);
htParams.put ("fileData", s);
loadScript =  new J.util.SB ().append ("{\n    var ").append (filename.substring (1)).append (" = ").append (J.util.Escape.eS (s)).append (";\n    ").appendSB (loadScript);
}}var os = null;
if (localName != null) {
if (localName.equals (".")) localName = this.viewer.getFilePath (filename, true);
if (localName.length == 0 || this.viewer.getFilePath (localName, false).equalsIgnoreCase (this.viewer.getFilePath (filename, false))) this.error (22);
var fullPath = [localName];
os = this.viewer.getOutputStream (localName, fullPath);
if (os == null) J.util.Logger.error ("Could not create output stream for " + fullPath[0]);
 else htParams.put ("OutputStream", os);
}if (filenames == null && tokType == 0) {
loadScript.append (" ");
if (isVariable || isInline) {
loadScript.append (J.util.Escape.eS (filename));
} else if (!isData) {
if (!filename.equals ("string") && !filename.equals ("string[]")) loadScript.append ("/*file*/");
if (localName != null) localName = this.viewer.getFilePath (localName, false);
loadScript.append ((localName != null ? J.util.Escape.eS (localName) : "$FILENAME$"));
}if (sOptions.length > 0) loadScript.append (" /*options*/ ").append (sOptions);
if (isVariable) loadScript.append ("\n  }");
htParams.put ("loadScript", loadScript);
}this.setCursorWait (true);
errMsg = this.viewer.loadModelFromFile (null, filename, filenames, null, isAppend, htParams, loadScript, tokType);
if (os != null) try {
this.viewer.setFileInfo ([localName, localName, localName]);
J.util.Logger.info (J.i18n.GT._ ("file {0} created", localName));
this.showString (this.viewer.getFilePath (localName, false) + " created");
os.close ();
} catch (e) {
if (Clazz.exceptionOf (e, java.io.IOException)) {
J.util.Logger.error ("error closing file " + e.toString ());
} else {
throw e;
}
}
if (tokType > 0) {
this.viewer.setFileInfo (tempFileInfo);
if (errMsg != null && !this.isCmdLine_c_or_C_Option) this.evalError (errMsg, null);
return;
}if (errMsg != null && !this.isCmdLine_c_or_C_Option) {
if (errMsg.indexOf ("NOTE: file recognized as a script file: ") == 0) {
filename = errMsg.substring ("NOTE: file recognized as a script file: ".length).trim ();
this.script (0, filename);
return;
}this.evalError (errMsg, null);
}if (isAppend && (appendNew || nFiles > 1)) {
this.viewer.setAnimationRange (-1, -1);
this.viewer.setCurrentModelIndex (modelCount0);
}if (this.scriptLevel == 0 && !isAppend && nFiles < 2) this.showString (this.viewer.getModelSetAuxiliaryInfoValue ("modelLoadNote"));
if (this.logMessages) this.scriptStatusOrBuffer ("Successfully loaded:" + (filenames == null ? htParams.get ("fullPathName") : modelName));
var info = this.viewer.getModelSetAuxiliaryInfo ();
if (info != null && info.containsKey ("centroidMinMax") && this.viewer.getAtomCount () > 0) this.viewer.setCentroid (isAppend ? atomCount0 : 0, this.viewer.getAtomCount () - 1, info.get ("centroidMinMax"));
var script = this.viewer.getDefaultLoadScript ();
var msg = "";
if (script.length > 0) msg += "\nUsing defaultLoadScript: " + script;
if (info != null && this.viewer.allowEmbeddedScripts ()) {
var embeddedScript = info.remove ("jmolscript");
if (embeddedScript != null && embeddedScript.length > 0) {
msg += "\nAdding embedded #jmolscript: " + embeddedScript;
script += ";" + embeddedScript;
this.setStringProperty ("_loadScript", script);
script = "allowEmbeddedScripts = false;try{" + script + "} allowEmbeddedScripts = true;";
}}this.logLoadInfo (msg);
var siteScript = (info == null ? null : info.remove ("sitescript"));
if (siteScript != null) script = siteScript + ";" + script;
if (script.length > 0 && !this.isCmdLine_c_or_C_Option) this.runScript (script);
}, $fz.isPrivate = true, $fz));
$_M(c$, "logLoadInfo", 
($fz = function (msg) {
if (msg.length > 0) J.util.Logger.info (msg);
var sb =  new J.util.SB ();
var modelCount = this.viewer.getModelCount ();
if (modelCount > 1) sb.append ((this.viewer.isMovie () ? this.viewer.getFrameCount () + " frames" : modelCount + " models") + "\n");
for (var i = 0; i < modelCount; i++) {
var moData = this.viewer.getModelAuxiliaryInfoValue (i, "moData");
if (moData == null) continue;
sb.appendI ((moData.get ("mos")).size ()).append (" molecular orbitals in model ").append (this.viewer.getModelNumberDotted (i)).append ("\n");
}
if (sb.length () > 0) this.showString (sb.toString ());
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "getFullPathName", 
($fz = function () {
var filename = (!this.chk || this.isCmdLine_C_Option ? this.viewer.getFullPathName () : "test.xyz");
if (filename == null) this.error (22);
return filename;
}, $fz.isPrivate = true, $fz));
$_M(c$, "measure", 
($fz = function () {
if (this.tokAt (1) == 135267335) {
var smarts = this.stringParameter (this.slen == 3 ? 2 : 4);
if (this.chk) return;
var atoms = this.viewer.modelSet.atoms;
var atomCount = this.viewer.getAtomCount ();
var maps = this.viewer.getSmilesMatcher ().getCorrelationMaps (smarts, atoms, atomCount, this.viewer.getSelectionSet (false), true, false);
if (maps == null) return;
this.setShapeProperty (6, "maps", maps);
return;
}switch (this.slen) {
case 1:
case 2:
switch (this.getToken (1).tok) {
case 0:
case 1048589:
this.setShapeProperty (6, "hideAll", Boolean.FALSE);
return;
case 1048588:
this.setShapeProperty (6, "hideAll", Boolean.TRUE);
return;
case 1073742001:
if (!this.chk) this.showStringPrint (this.viewer.getMeasurementInfoAsString (), false);
return;
case 12291:
if (!this.chk) this.viewer.clearAllMeasurements ();
return;
case 4:
this.setShapeProperty (6, "setFormats", this.stringParameter (1));
return;
}
this.errorStr (24, "ON, OFF, DELETE");
break;
case 3:
switch (this.getToken (1).tok) {
case 12291:
if (this.getToken (2).tok == 1048579) {
if (!this.chk) this.viewer.clearAllMeasurements ();
} else {
var i = this.intParameter (2) - 1;
if (!this.chk) this.viewer.deleteMeasurement (i);
}return;
}
}
var nAtoms = 0;
var expressionCount = 0;
var modelIndex = -1;
var atomIndex = -1;
var ptFloat = -1;
var countPlusIndexes =  Clazz.newIntArray (5, 0);
var rangeMinMax = [3.4028235E38, 3.4028235E38];
var isAll = false;
var isAllConnected = false;
var isNotConnected = false;
var isRange = true;
var rd = null;
var intramolecular = null;
var tokAction = 269484114;
var strFormat = null;
var points =  new J.util.JmolList ();
var bs =  new J.util.BS ();
var value = null;
var tickInfo = null;
var nBitSets = 0;
for (var i = 1; i < this.slen; ++i) {
switch (this.getToken (i).tok) {
case 1073741824:
this.errorStr (24, "ALL, ALLCONNECTED, DELETE");
break;
default:
this.error (15);
break;
case 269484144:
if (this.tokAt (i + 1) != 135266310) this.error (22);
i++;
isNotConnected = true;
break;
case 135266310:
case 1073741834:
case 1048579:
isAllConnected = (this.theTok == 1073741834);
atomIndex = -1;
isAll = true;
if (isAllConnected && isNotConnected) this.error (22);
break;
case 3:
if (rd != null) this.error (22);
isAll = true;
isRange = true;
ptFloat = (ptFloat + 1) % 2;
rangeMinMax[ptFloat] = this.floatParameter (i);
break;
case 12291:
if (tokAction != 269484114) this.error (22);
tokAction = 12291;
break;
case 2:
var iParam = this.intParameter (i);
if (isAll) {
isRange = true;
ptFloat = (ptFloat + 1) % 2;
rangeMinMax[ptFloat] = iParam;
} else {
atomIndex = this.viewer.getAtomIndexFromAtomNumber (iParam);
if (!this.chk && atomIndex < 0) return;
if (value != null) this.error (22);
if ((countPlusIndexes[0] = ++nAtoms) > 4) this.error (2);
countPlusIndexes[nAtoms] = atomIndex;
}break;
case 1095761933:
modelIndex = this.intParameter (++i);
break;
case 1048588:
if (tokAction != 269484114) this.error (22);
tokAction = 1048588;
break;
case 1048589:
if (tokAction != 269484114) this.error (22);
tokAction = 1048589;
break;
case 1073742114:
isAll = true;
isRange = true;
atomIndex = -1;
break;
case 1073741989:
case 1073741990:
intramolecular = Boolean.$valueOf (this.theTok == 1073741989);
isAll = true;
isNotConnected = (this.theTok == 1073741990);
break;
case 1649412112:
if (ptFloat >= 0) this.error (22);
rd = this.encodeRadiusParameter (i, false, true);
rd.values = rangeMinMax;
i = this.iToken;
isNotConnected = true;
isAll = true;
intramolecular = Boolean.$valueOf (false);
if (nBitSets == 1) {
nBitSets++;
nAtoms++;
var bs2 = J.util.BSUtil.copy (bs);
J.util.BSUtil.invertInPlace (bs2, this.viewer.getAtomCount ());
bs2.and (this.viewer.getAtomsWithinRadius (5, bs, false, null));
points.addLast (bs2);
}break;
case 10:
case 1048577:
case 1048586:
case 8:
case 1048583:
if (this.theTok == 10 || this.theTok == 1048577) nBitSets++;
if (atomIndex >= 0) this.error (22);
this.expressionResult = Boolean.FALSE;
value = this.centerParameter (i);
if (Clazz.instanceOf (this.expressionResult, J.util.BS)) {
value = bs = this.expressionResult;
if (!this.chk && bs.length () == 0) return;
}if (Clazz.instanceOf (value, J.util.P3)) {
var v =  new J.util.Point3fi ();
v.setT (value);
v.modelIndex = modelIndex;
value = v;
}if ((nAtoms = ++expressionCount) > 4) this.error (2);
i = this.iToken;
points.addLast (value);
break;
case 4:
strFormat = this.stringParameter (i);
break;
case 1073742164:
tickInfo = this.checkTicks (i, false, true, true);
i = this.iToken;
tokAction = 1060866;
break;
}
}
if (rd != null && (ptFloat >= 0 || nAtoms != 2) || nAtoms < 2 && (tickInfo == null || nAtoms == 1)) this.error (2);
if (strFormat != null && strFormat.indexOf (nAtoms + ":") != 0) strFormat = nAtoms + ":" + strFormat;
if (isRange) {
if (rangeMinMax[1] < rangeMinMax[0]) {
rangeMinMax[1] = rangeMinMax[0];
rangeMinMax[0] = (rangeMinMax[1] == 3.4028235E38 ? 3.4028235E38 : -200);
}}if (this.chk) return;
if (value != null || tickInfo != null) {
if (rd == null) rd =  new J.atomdata.RadiusData (rangeMinMax, 0, null, null);
if (value == null) tickInfo.id = "default";
if (value != null && strFormat != null && tokAction == 269484114) tokAction = 1060866;
this.setShapeProperty (6, "measure", ( new J.modelset.MeasurementData (this.viewer, points)).set (tokAction, rd, strFormat, null, tickInfo, isAllConnected, isNotConnected, intramolecular, isAll));
return;
}switch (tokAction) {
case 12291:
this.setShapeProperty (6, "delete", countPlusIndexes);
break;
case 1048589:
this.setShapeProperty (6, "show", countPlusIndexes);
break;
case 1048588:
this.setShapeProperty (6, "hide", countPlusIndexes);
break;
default:
this.setShapeProperty (6, (strFormat == null ? "toggle" : "toggleOn"), countPlusIndexes);
if (strFormat != null) this.setShapeProperty (6, "setFormats", strFormat);
}
}, $fz.isPrivate = true, $fz));
$_M(c$, "plot", 
($fz = function (args) {
var modelIndex = this.viewer.getCurrentModelIndex ();
if (modelIndex < 0) this.errorStr (30, "plot");
modelIndex = this.viewer.getJmolDataSourceFrame (modelIndex);
var pt = args.length - 1;
var isReturnOnly = (args !== this.st);
var statementSave = this.st;
if (isReturnOnly) this.st = args;
var tokCmd = (isReturnOnly ? 4148 : args[0].tok);
var pt0 = (isReturnOnly || tokCmd == 135270417 || tokCmd == 1052714 ? 0 : 1);
var filename = null;
var makeNewFrame = true;
var isDraw = false;
switch (tokCmd) {
case 4133:
case 135270417:
case 1052714:
break;
case 135176:
makeNewFrame = false;
isDraw = true;
break;
case 4148:
makeNewFrame = false;
break;
case 135270421:
makeNewFrame = false;
if (J.script.ScriptEvaluator.tokAtArray (pt, args) == 4) {
filename = this.stringParameter (pt--);
} else if (J.script.ScriptEvaluator.tokAtArray (pt - 1, args) == 1048584) {
filename = this.parameterAsString (pt - 2) + "." + this.parameterAsString (pt);
pt -= 3;
} else {
this.st = statementSave;
this.iToken = this.st.length;
this.error (13);
}break;
}
var qFrame = "";
var parameters = null;
var stateScript = "";
var isQuaternion = false;
var isDerivative = false;
var isSecondDerivative = false;
var isRamachandranRelative = false;
var propertyX = 0;
var propertyY = 0;
var propertyZ = 0;
var bs = J.util.BSUtil.copy (this.viewer.getSelectionSet (false));
var preSelected = "; select " + J.util.Escape.eBS (bs) + ";\n ";
var type = this.optParameterAsString (pt).toLowerCase ();
var minXYZ = null;
var maxXYZ = null;
var tok = J.script.ScriptEvaluator.tokAtArray (pt0, args);
if (tok == 4) tok = J.script.T.getTokFromName (args[pt0].value);
switch (tok) {
default:
this.iToken = 1;
this.error (22);
break;
case 135270407:
this.iToken = 1;
type = "data";
preSelected = "";
break;
case 1716520973:
this.iToken = pt0 + 1;
if (!J.script.T.tokAttr (propertyX = this.tokAt (this.iToken++), 1078984704) || !J.script.T.tokAttr (propertyY = this.tokAt (this.iToken++), 1078984704)) this.error (22);
if (J.script.T.tokAttr (propertyZ = this.tokAt (this.iToken), 1078984704)) this.iToken++;
 else propertyZ = 0;
if (this.tokAt (this.iToken) == 32) {
minXYZ = this.getPoint3f (++this.iToken, false);
this.iToken++;
}if (this.tokAt (this.iToken) == 64) {
maxXYZ = this.getPoint3f (++this.iToken, false);
this.iToken++;
}type = "property " + J.script.T.nameOf (propertyX) + " " + J.script.T.nameOf (propertyY) + (propertyZ == 0 ? "" : " " + J.script.T.nameOf (propertyZ));
if (bs.nextSetBit (0) < 0) bs = this.viewer.getModelUndeletedAtomsBitSet (modelIndex);
stateScript = "select " + J.util.Escape.eBS (bs) + ";\n ";
break;
case 1052714:
if (type.equalsIgnoreCase ("draw")) {
isDraw = true;
type = this.optParameterAsString (--pt).toLowerCase ();
}isRamachandranRelative = (pt > pt0 && type.startsWith ("r"));
type = "ramachandran" + (isRamachandranRelative ? " r" : "") + (tokCmd == 135176 ? " draw" : "");
break;
case 135270417:
case 137363468:
qFrame = " \"" + this.viewer.getQuaternionFrame () + "\"";
stateScript = "set quaternionFrame" + qFrame + ";\n  ";
isQuaternion = true;
if (type.equalsIgnoreCase ("draw")) {
isDraw = true;
type = this.optParameterAsString (--pt).toLowerCase ();
}isDerivative = (type.startsWith ("deriv") || type.startsWith ("diff"));
isSecondDerivative = (isDerivative && type.indexOf ("2") > 0);
if (isDerivative) pt--;
if (type.equalsIgnoreCase ("helix") || type.equalsIgnoreCase ("axis")) {
isDraw = true;
isDerivative = true;
pt = -1;
}type = ((pt <= pt0 ? "" : this.optParameterAsString (pt)) + "w").substring (0, 1);
if (type.equals ("a") || type.equals ("r")) isDerivative = true;
if (!J.util.Parser.isOneOf (type, "w;x;y;z;r;a")) this.evalError ("QUATERNION [w,x,y,z,a,r] [difference][2]", null);
type = "quaternion " + type + (isDerivative ? " difference" : "") + (isSecondDerivative ? "2" : "") + (isDraw ? " draw" : "");
break;
}
this.st = statementSave;
if (this.chk) return "";
if (makeNewFrame) {
stateScript += "plot " + type;
var ptDataFrame = this.viewer.getJmolDataFrameIndex (modelIndex, stateScript);
if (ptDataFrame > 0 && tokCmd != 135270421 && tokCmd != 4148) {
this.viewer.setCurrentModelIndexClear (ptDataFrame, true);
return "";
}}var dataX = null;
var dataY = null;
var dataZ = null;
var factors = J.util.P3.new3 (1, 1, 1);
if (tok == 1716520973) {
dataX = this.getBitsetPropertyFloat (bs, propertyX | 224, (minXYZ == null ? NaN : minXYZ.x), (maxXYZ == null ? NaN : maxXYZ.x));
dataY = this.getBitsetPropertyFloat (bs, propertyY | 224, (minXYZ == null ? NaN : minXYZ.y), (maxXYZ == null ? NaN : maxXYZ.y));
if (propertyZ != 0) dataZ = this.getBitsetPropertyFloat (bs, propertyZ | 224, (minXYZ == null ? NaN : minXYZ.z), (maxXYZ == null ? NaN : maxXYZ.z));
if (minXYZ == null) minXYZ = J.util.P3.new3 (J.script.ScriptEvaluator.getMinMax (dataX, false, propertyX), J.script.ScriptEvaluator.getMinMax (dataY, false, propertyY), J.script.ScriptEvaluator.getMinMax (dataZ, false, propertyZ));
if (maxXYZ == null) maxXYZ = J.util.P3.new3 (J.script.ScriptEvaluator.getMinMax (dataX, true, propertyX), J.script.ScriptEvaluator.getMinMax (dataY, true, propertyY), J.script.ScriptEvaluator.getMinMax (dataZ, true, propertyZ));
J.util.Logger.info ("plot min/max: " + minXYZ + " " + maxXYZ);
var center = J.util.P3.newP (maxXYZ);
center.add (minXYZ);
center.scale (0.5);
factors.setT (maxXYZ);
factors.sub (minXYZ);
factors.set (factors.x / 200, factors.y / 200, factors.z / 200);
if (J.script.T.tokAttr (propertyX, 1095761920)) {
factors.x = 1;
center.x = 0;
} else if (factors.x > 0.1 && factors.x <= 10) {
factors.x = 1;
}if (J.script.T.tokAttr (propertyY, 1095761920)) {
factors.y = 1;
center.y = 0;
} else if (factors.y > 0.1 && factors.y <= 10) {
factors.y = 1;
}if (J.script.T.tokAttr (propertyZ, 1095761920)) {
factors.z = 1;
center.z = 0;
} else if (factors.z > 0.1 && factors.z <= 10) {
factors.z = 1;
}if (propertyZ == 0) center.z = minXYZ.z = maxXYZ.z = factors.z = 0;
for (var i = 0; i < dataX.length; i++) dataX[i] = (dataX[i] - center.x) / factors.x;

for (var i = 0; i < dataY.length; i++) dataY[i] = (dataY[i] - center.y) / factors.y;

if (propertyZ != 0) for (var i = 0; i < dataZ.length; i++) dataZ[i] = (dataZ[i] - center.z) / factors.z;

parameters = [bs, dataX, dataY, dataZ, minXYZ, maxXYZ, factors, center];
}if (tokCmd == 135270421) return this.viewer.streamFileData (filename, "PLOT", type, modelIndex, parameters);
var data = (type.equals ("data") ? "1 0 H 0 0 0 # Jmol PDB-encoded data" : this.viewer.getPdbData (modelIndex, type, parameters));
if (tokCmd == 4148) return data;
if (J.util.Logger.debugging) J.util.Logger.info (data);
if (tokCmd == 135176) {
this.runScript (data);
return "";
}var savedFileInfo = this.viewer.getFileInfo ();
var oldAppendNew = this.viewer.getBoolean (603979792);
this.viewer.setAppendNew (true);
var isOK = (data != null && this.viewer.loadInline (data, true) == null);
this.viewer.setAppendNew (oldAppendNew);
this.viewer.setFileInfo (savedFileInfo);
if (!isOK) return "";
var modelCount = this.viewer.getModelCount ();
this.viewer.setJmolDataFrame (stateScript, modelIndex, modelCount - 1);
if (tok != 1716520973) stateScript += ";\n" + preSelected;
var ss = this.viewer.addStateScript (stateScript, true, false);
var radius = 150;
var script;
switch (tok) {
default:
script = "frame 0.0; frame last; reset;select visible;wireframe only;";
radius = 10;
break;
case 1716520973:
this.viewer.setFrameTitle (modelCount - 1, type + " plot for model " + this.viewer.getModelNumberDotted (modelIndex));
var f = 3;
script = "frame 0.0; frame last; reset;select visible; spacefill " + f + "; wireframe 0;" + "draw plotAxisX" + modelCount + " {100 -100 -100} {-100 -100 -100} \"" + J.script.T.nameOf (propertyX) + "\";" + "draw plotAxisY" + modelCount + " {-100 100 -100} {-100 -100 -100} \"" + J.script.T.nameOf (propertyY) + "\";";
if (propertyZ != 0) script += "draw plotAxisZ" + modelCount + " {-100 -100 100} {-100 -100 -100} \"" + J.script.T.nameOf (propertyZ) + "\";";
break;
case 1052714:
this.viewer.setFrameTitle (modelCount - 1, "ramachandran plot for model " + this.viewer.getModelNumberDotted (modelIndex));
script = "frame 0.0; frame last; reset;select visible; color structure; spacefill 3.0; wireframe 0;draw ramaAxisX" + modelCount + " {100 0 0} {-100 0 0} \"phi\";" + "draw ramaAxisY" + modelCount + " {0 100 0} {0 -100 0} \"psi\";";
break;
case 135270417:
case 137363468:
this.viewer.setFrameTitle (modelCount - 1, type.$replace ('w', ' ') + qFrame + " for model " + this.viewer.getModelNumberDotted (modelIndex));
var color = (J.util.C.getHexCode (this.viewer.getColixBackgroundContrast ()));
script = "frame 0.0; frame last; reset;select visible; wireframe 0; spacefill 3.0; isosurface quatSphere" + modelCount + " color " + color + " sphere 100.0 mesh nofill frontonly translucent 0.8;" + "draw quatAxis" + modelCount + "X {100 0 0} {-100 0 0} color red \"x\";" + "draw quatAxis" + modelCount + "Y {0 100 0} {0 -100 0} color green \"y\";" + "draw quatAxis" + modelCount + "Z {0 0 100} {0 0 -100} color blue \"z\";" + "color structure;" + "draw quatCenter" + modelCount + "{0 0 0} scale 0.02;";
break;
}
this.runScript (script + preSelected);
ss.setModelIndex (this.viewer.getCurrentModelIndex ());
this.viewer.setRotationRadius (radius, true);
this.sm.loadShape (30);
this.showString ("frame " + this.viewer.getModelNumberDotted (modelCount - 1) + (type.length > 0 ? " created: " + type + (isQuaternion ? qFrame : "") : ""));
return "";
}, $fz.isPrivate = true, $fz), "~A");
c$.getMinMax = $_M(c$, "getMinMax", 
($fz = function (data, isMax, tok) {
if (data == null) return 0;
switch (tok) {
case 1112539142:
case 1112539143:
case 1112539144:
return (isMax ? 180 : -180);
case 1112539140:
case 1112539150:
return (isMax ? 360 : 0);
case 1112539148:
return (isMax ? 1 : -1);
}
var fmax = (isMax ? -1.0E10 : 1E10);
for (var i = data.length; --i >= 0; ) {
var f = data[i];
if (Float.isNaN (f)) continue;
if (isMax == (f > fmax)) fmax = f;
}
return fmax;
}, $fz.isPrivate = true, $fz), "~A,~B,~N");
$_M(c$, "pause", 
($fz = function () {
if (this.chk || this.isJS && !this.allowJSThreads) return false;
var msg = this.optParameterAsString (1);
if (!this.viewer.getBooleanProperty ("_useCommandThread")) {
}if (this.viewer.autoExit || !this.viewer.haveDisplay && !this.viewer.isWebGL) return false;
if (this.scriptLevel == 0 && this.pc == this.aatoken.length - 1) {
this.viewer.scriptStatus ("nothing to pause: " + msg);
return false;
}msg = (msg.length == 0 ? ": RESUME to continue." : ": " + this.viewer.formatText (msg));
this.pauseExecution (true);
this.viewer.scriptStatusMsg ("script execution paused" + msg, "script paused for RESUME");
return true;
}, $fz.isPrivate = true, $fz));
$_M(c$, "print", 
($fz = function () {
if (this.slen == 1) this.error (2);
this.showStringPrint (this.parameterExpressionString (1, 0), true);
}, $fz.isPrivate = true, $fz));
$_M(c$, "prompt", 
($fz = function () {
var msg = null;
if (this.slen == 1) {
if (!this.chk) msg = J.script.ScriptEvaluator.getContextTrace (this.getScriptContext (), null, true).toString ();
} else {
msg = this.parameterExpressionString (1, 0);
}if (!this.chk) this.viewer.prompt (msg, "OK", null, true);
}, $fz.isPrivate = true, $fz));
$_M(c$, "refresh", 
($fz = function () {
if (this.chk) return;
this.viewer.setTainted (true);
this.viewer.requestRepaintAndWait ();
}, $fz.isPrivate = true, $fz));
$_M(c$, "reset", 
($fz = function () {
if (this.slen == 3 && this.tokAt (1) == 135368713) {
if (!this.chk) this.viewer.removeFunction (this.stringParameter (2));
return;
}this.checkLength (-2);
if (this.chk) return;
if (this.slen == 1) {
this.viewer.reset (false);
return;
}switch (this.tokAt (1)) {
case 135270422:
this.viewer.cacheClear ();
return;
case 1073741936:
this.viewer.resetError ();
return;
case 1087373323:
this.viewer.resetShapes (true);
return;
case 135368713:
this.viewer.clearFunctions ();
return;
case 1641025539:
var bsAllAtoms =  new J.util.BS ();
this.runScript (this.viewer.getDefaultStructure (null, bsAllAtoms));
this.viewer.resetBioshapes (bsAllAtoms);
return;
case 1649412112:
this.viewer.setData ("element_vdw", [null, ""], 0, 0, 0, 0, 0);
return;
case 1076887572:
this.viewer.resetAromatic ();
return;
case 1611141175:
this.viewer.reset (true);
return;
}
var $var = this.parameterAsString (1);
if ($var.charAt (0) == '_') this.error (22);
this.viewer.unsetProperty ($var);
}, $fz.isPrivate = true, $fz));
$_M(c$, "restrict", 
($fz = function () {
var isBond = (this.tokAt (1) == 1678770178);
this.select (isBond ? 2 : 1);
this.restrictSelected (isBond, true);
}, $fz.isPrivate = true, $fz));
$_M(c$, "restrictSelected", 
($fz = function (isBond, doInvert) {
if (this.chk) return;
var bsSelected = J.util.BSUtil.copy (this.viewer.getSelectionSet (true));
if (doInvert) {
this.viewer.invertSelection ();
var bsSubset = this.viewer.getSelectionSubset ();
if (bsSubset != null) {
bsSelected = J.util.BSUtil.copy (this.viewer.getSelectionSet (true));
bsSelected.and (bsSubset);
this.viewer.select (bsSelected, false, null, true);
J.util.BSUtil.invertInPlace (bsSelected, this.viewer.getAtomCount ());
bsSelected.and (bsSubset);
}}J.util.BSUtil.andNot (bsSelected, this.viewer.getDeletedAtoms ());
var bondmode = this.viewer.getBoolean (603979812);
if (!isBond) this.setBooleanProperty ("bondModeOr", true);
this.setShapeSizeBs (1, 0, null);
this.setShapeProperty (1, "type", Integer.$valueOf (32768));
this.setShapeSizeBs (1, 0, null);
this.setShapeProperty (1, "type", Integer.$valueOf (1023));
var bs = this.viewer.getSelectionSet (false);
for (var iShape = 21; --iShape >= 0; ) if (iShape != 6 && this.sm.getShape (iShape) != null) this.setShapeSizeBs (iShape, 0, bs);

if (this.sm.getShape (21) != null) this.setShapeProperty (21, "delete", bs);
this.sm.setLabel (null, bs);
if (!isBond) this.setBooleanProperty ("bondModeOr", bondmode);
this.viewer.select (bsSelected, false, null, true);
}, $fz.isPrivate = true, $fz), "~B,~B");
$_M(c$, "rotate", 
($fz = function (isSpin, isSelected) {
if (this.slen == 2) switch (this.getToken (1).tok) {
case 1048589:
if (!this.chk) this.viewer.setSpinOn (true);
return;
case 1048588:
if (!this.chk) this.viewer.setSpinOn (false);
return;
}
var bsAtoms = null;
var degreesPerSecond = 1.4E-45;
var nPoints = 0;
var endDegrees = 3.4028235E38;
var isMolecular = false;
var haveRotation = false;
var ptsA = null;
var points =  new Array (2);
var rotAxis = J.util.V3.new3 (0, 1, 0);
var translation = null;
var m4 = null;
var m3 = null;
var direction = 1;
var tok;
var q = null;
var helicalPath = false;
var ptsB = null;
var bsCompare = null;
var invPoint = null;
var invPlane = null;
var axesOrientationRasmol = this.viewer.getBoolean (603979806);
for (var i = 1; i < this.slen; ++i) {
switch (tok = this.getToken (i).tok) {
case 10:
case 1048577:
case 1048586:
case 8:
case 1048583:
if (tok == 10 || tok == 1048577) {
if (translation != null || q != null || nPoints == 2) {
bsAtoms = this.atomExpressionAt (i);
ptsB = null;
isSelected = true;
break;
}}haveRotation = true;
if (nPoints == 2) nPoints = 0;
var pt1 = this.centerParameterForModel (i, this.viewer.getCurrentModelIndex ());
if (!this.chk && tok == 1048583 && this.tokAt (i + 2) != 269484096) {
isMolecular = true;
rotAxis = this.getDrawObjectAxis (this.objectNameParameter (++i), this.viewer.getCurrentModelIndex ());
}points[nPoints++] = pt1;
break;
case 1611141175:
isSpin = true;
continue;
case 1073741988:
case 1073742029:
isMolecular = true;
continue;
case 1114638350:
isSelected = true;
break;
case 269484080:
continue;
case 2:
case 3:
if (isSpin) {
if (degreesPerSecond == 1.4E-45) {
degreesPerSecond = this.floatParameter (i);
continue;
} else if (endDegrees == 3.4028235E38) {
endDegrees = degreesPerSecond;
degreesPerSecond = this.floatParameter (i);
continue;
}} else {
if (endDegrees == 3.4028235E38) {
endDegrees = this.floatParameter (i);
continue;
} else if (degreesPerSecond == 1.4E-45) {
degreesPerSecond = this.floatParameter (i);
isSpin = true;
continue;
}}this.error (22);
break;
case 269484192:
direction = -1;
continue;
case 1112541205:
haveRotation = true;
rotAxis.set (direction, 0, 0);
continue;
case 1112541206:
haveRotation = true;
rotAxis.set (0, direction, 0);
continue;
case 1112541207:
haveRotation = true;
rotAxis.set (0, 0, (axesOrientationRasmol && !isMolecular ? -direction : direction));
continue;
case 9:
case 135270417:
if (tok == 135270417) i++;
haveRotation = true;
q = this.getQuaternionParameter (i);
rotAxis.setT (q.getNormal ());
endDegrees = q.getTheta ();
break;
case 135266307:
haveRotation = true;
if (this.isPoint3f (++i)) {
rotAxis.setT (this.centerParameter (i));
break;
}var p4 = this.getPoint4f (i);
rotAxis.set (p4.x, p4.y, p4.z);
endDegrees = p4.w;
q = J.util.Quaternion.newVA (rotAxis, endDegrees);
break;
case 1048580:
haveRotation = true;
var iAtom1 = this.atomExpressionAt (++i).nextSetBit (0);
var iAtom2 = this.atomExpressionAt (++this.iToken).nextSetBit (0);
if (iAtom1 < 0 || iAtom2 < 0) return;
bsAtoms = this.viewer.getBranchBitSet (iAtom2, iAtom1);
isSelected = true;
isMolecular = true;
points[0] = this.viewer.getAtomPoint3f (iAtom1);
points[1] = this.viewer.getAtomPoint3f (iAtom2);
nPoints = 2;
break;
case 4160:
translation = J.util.V3.newV (this.centerParameter (++i));
isMolecular = isSelected = true;
break;
case 137363468:
helicalPath = true;
continue;
case 1297090050:
var symop = this.intParameter (++i);
if (this.chk) continue;
var info = this.viewer.getSpaceGroupInfo (null);
var op = (info == null ? null : info.get ("operations"));
if (symop == 0 || op == null || op.length < Math.abs (symop)) this.error (22);
op = op[Math.abs (symop) - 1];
translation = op[5];
invPoint = op[6];
points[0] = op[7];
if (op[8] != null) rotAxis = op[8];
endDegrees = (op[9]).intValue ();
if (symop < 0) {
endDegrees = -endDegrees;
if (translation != null) translation.scale (-1);
}if (endDegrees == 0 && points[0] != null) {
rotAxis.normalize ();
J.util.Measure.getPlaneThroughPoint (points[0], rotAxis, invPlane =  new J.util.P4 ());
}q = J.util.Quaternion.newVA (rotAxis, endDegrees);
nPoints = (points[0] == null ? 0 : 1);
isMolecular = true;
haveRotation = true;
isSelected = true;
continue;
case 135270405:
case 12:
case 11:
haveRotation = true;
if (tok == 135270405) {
bsCompare = this.atomExpressionAt (++i);
ptsA = this.viewer.getAtomPointVector (bsCompare);
if (ptsA == null) this.errorAt (22, i);
i = this.iToken;
ptsB = this.getPointVector (this.getToken (++i), i);
if (ptsB == null || ptsA.size () != ptsB.size ()) this.errorAt (22, i);
m4 =  new J.util.Matrix4f ();
points[0] =  new J.util.P3 ();
nPoints = 1;
var stddev = (this.chk ? 0 : J.util.Measure.getTransformMatrix4 (ptsA, ptsB, m4, points[0]));
if (stddev > 0.001) ptsB = null;
} else if (tok == 12) {
m4 = this.theToken.value;
}m3 =  new J.util.Matrix3f ();
if (m4 != null) {
translation =  new J.util.V3 ();
m4.get (translation);
m4.getRotationScale (m3);
} else {
m3 = this.theToken.value;
}q = (this.chk ?  new J.util.Quaternion () : J.util.Quaternion.newM (m3));
rotAxis.setT (q.getNormal ());
endDegrees = q.getTheta ();
isMolecular = true;
break;
default:
this.error (22);
}
i = this.iToken;
}
if (this.chk) return;
if (isSelected && bsAtoms == null) bsAtoms = this.viewer.getSelectionSet (false);
if (bsCompare != null) {
isSelected = true;
if (bsAtoms == null) bsAtoms = bsCompare;
}var rate = (degreesPerSecond == 1.4E-45 ? 10 : endDegrees == 3.4028235E38 ? degreesPerSecond : (degreesPerSecond < 0) == (endDegrees > 0) ? -endDegrees / degreesPerSecond : degreesPerSecond);
if (q != null) {
if (nPoints == 0 && translation != null) points[0] = this.viewer.getAtomSetCenter (bsAtoms != null ? bsAtoms : isSelected ? this.viewer.getSelectionSet (false) : this.viewer.getModelUndeletedAtomsBitSet (-1));
if (helicalPath && translation != null) {
points[1] = J.util.P3.newP (points[0]);
points[1].add (translation);
var ret = J.util.Measure.computeHelicalAxis (null, 135266306, points[0], points[1], q);
points[0] = ret[0];
var theta = (ret[3]).x;
if (theta != 0) {
translation = ret[1];
rotAxis = J.util.V3.newV (translation);
if (theta < 0) rotAxis.scale (-1);
}m4 = null;
}if (isSpin && m4 == null) m4 = J.script.ScriptMathProcessor.getMatrix4f (q.getMatrix (), translation);
if (points[0] != null) nPoints = 1;
}if (invPoint != null) {
this.viewer.invertAtomCoordPt (invPoint, bsAtoms);
if (rotAxis == null) return;
}if (invPlane != null) {
this.viewer.invertAtomCoordPlane (invPlane, bsAtoms);
if (rotAxis == null) return;
}if (nPoints < 2) {
if (!isMolecular) {
if (isSpin && bsAtoms == null && !this.useThreads ()) return;
if (this.viewer.rotateAxisAngleAtCenter (this, points[0], rotAxis, rate, endDegrees, isSpin, bsAtoms) && this.isJS && isSpin && bsAtoms == null) throw  new J.script.ScriptInterruption (this, "rotate", 1);
return;
}if (nPoints == 0) points[0] =  new J.util.P3 ();
points[1] = J.util.P3.newP (points[0]);
points[1].add (rotAxis);
nPoints = 2;
}if (nPoints == 0) points[0] =  new J.util.P3 ();
if (nPoints < 2 || points[0].distance (points[1]) == 0) {
points[1] = J.util.P3.newP (points[0]);
points[1].y += 1.0;
}if (endDegrees == 3.4028235E38) endDegrees = 0;
if (endDegrees != 0 && translation != null && !haveRotation) translation.scale (endDegrees / translation.length ());
if (isSpin && translation != null && (endDegrees == 0 || degreesPerSecond == 0)) {
endDegrees = 0.01;
rate = (degreesPerSecond == 1.4E-45 ? 0.01 : degreesPerSecond < 0 ? -endDegrees / degreesPerSecond : degreesPerSecond * 0.01 / translation.length ());
degreesPerSecond = 0.01;
}if (bsAtoms != null && isSpin && ptsB == null && m4 != null) {
ptsA = this.viewer.getAtomPointVector (bsAtoms);
ptsB = J.util.Measure.transformPoints (ptsA, m4, points[0]);
}if (bsAtoms != null && !isSpin && ptsB != null) {
this.viewer.setAtomCoords (bsAtoms, 1146095626, ptsB);
} else {
if (!this.useThreads ()) return;
if (this.viewer.rotateAboutPointsInternal (this, points[0], points[1], rate, endDegrees, isSpin, bsAtoms, translation, ptsB) && this.isJS && isSpin) throw  new J.script.ScriptInterruption (this, "rotate", 1);
}}, $fz.isPrivate = true, $fz), "~B,~B");
$_M(c$, "getQuaternionParameter", 
($fz = function (i) {
if (this.tokAt (i) == 7) {
var sv = (this.getToken (i)).getList ();
var p4 = null;
if (sv.size () == 0 || (p4 = J.script.SV.pt4Value (sv.get (0))) == null) this.error (22);
return J.util.Quaternion.newP4 (p4);
}return J.util.Quaternion.newP4 (this.getPoint4f (i));
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "getPointVector", 
function (t, i) {
switch (t.tok) {
case 10:
return this.viewer.getAtomPointVector (t.value);
case 7:
var data =  new J.util.JmolList ();
var pt;
var pts = (t).getList ();
for (var j = 0; j < pts.size (); j++) if ((pt = J.script.SV.ptValue (pts.get (j))) != null) data.addLast (pt);
 else return null;

return data;
}
if (i > 0) return this.viewer.getAtomPointVector (this.atomExpressionAt (i));
return null;
}, "J.script.T,~N");
$_M(c$, "getObjectCenter", 
($fz = function (axisID, index, modelIndex) {
var data = [axisID, Integer.$valueOf (index), Integer.$valueOf (modelIndex)];
return (this.getShapePropertyData (22, "getCenter", data) || this.getShapePropertyData (24, "getCenter", data) || this.getShapePropertyData (28, "getCenter", data) || this.getShapePropertyData (25, "getCenter", data) || this.getShapePropertyData (27, "getCenter", data) ? data[2] : null);
}, $fz.isPrivate = true, $fz), "~S,~N,~N");
$_M(c$, "getObjectBoundingBox", 
($fz = function (id) {
var data = [id, null, null];
return (this.getShapePropertyData (24, "getBoundingBox", data) || this.getShapePropertyData (28, "getBoundingBox", data) || this.getShapePropertyData (25, "getBoundingBox", data) || this.getShapePropertyData (27, "getBoundingBox", data) ? data[2] : null);
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "getDrawObjectAxis", 
($fz = function (axisID, index) {
var data = [axisID, Integer.$valueOf (index), null];
return (this.getShapePropertyData (22, "getSpinAxis", data) ? data[2] : null);
}, $fz.isPrivate = true, $fz), "~S,~N");
$_M(c$, "script", 
($fz = function (tok, filename) {
var loadCheck = true;
var isCheck = false;
var doStep = false;
var lineNumber = 0;
var pc = 0;
var lineEnd = 0;
var pcEnd = 0;
var i = 2;
var theScript = null;
var localPath = null;
var remotePath = null;
var scriptPath = null;
var params = null;
if (tok == 135287308) {
this.checkLength (2);
if (!this.chk) this.viewer.jsEval (this.parameterAsString (1));
return;
}if (filename == null) {
tok = this.tokAt (1);
if (tok != 4) this.error (16);
filename = this.parameterAsString (1);
if (filename.equalsIgnoreCase ("applet")) {
var appID = this.parameterAsString (2);
theScript = this.parameterExpressionString (3, 0);
this.checkLast (this.iToken);
if (this.chk) return;
if (appID.length == 0 || appID.equals ("all")) appID = "*";
if (!appID.equals (".")) {
this.viewer.jsEval (appID + "\1" + theScript);
if (!appID.equals ("*")) return;
}} else {
tok = this.tokAt (this.slen - 1);
doStep = (tok == 266298);
if (filename.equalsIgnoreCase ("inline")) {
theScript = this.parameterExpressionString (2, (doStep ? this.slen - 1 : 0));
i = this.iToken + 1;
}while (filename.equalsIgnoreCase ("localPath") || filename.equalsIgnoreCase ("remotePath") || filename.equalsIgnoreCase ("scriptPath")) {
if (filename.equalsIgnoreCase ("localPath")) localPath = this.parameterAsString (i++);
 else if (filename.equalsIgnoreCase ("scriptPath")) scriptPath = this.parameterAsString (i++);
 else remotePath = this.parameterAsString (i++);
filename = this.parameterAsString (i++);
}
if ((tok = this.tokAt (i)) == 1073741878) {
isCheck = true;
tok = this.tokAt (++i);
}if (tok == 1073742050) {
loadCheck = false;
tok = this.tokAt (++i);
}if (tok == 1073741998 || tok == 1141899268) {
i++;
lineEnd = lineNumber = Math.max (this.intParameter (i++), 0);
if (this.checkToken (i)) {
if (this.getToken (i).tok == 269484192) lineEnd = (this.checkToken (++i) ? this.intParameter (i++) : 0);
 else lineEnd = -this.intParameter (i++);
if (lineEnd <= 0) this.error (22);
}} else if (tok == 1073741890 || tok == 1073741892) {
i++;
pc = Math.max (this.intParameter (i++) - 1, 0);
pcEnd = pc + 1;
if (this.checkToken (i)) {
if (this.getToken (i).tok == 269484192) pcEnd = (this.checkToken (++i) ? this.intParameter (i++) : 0);
 else pcEnd = -this.intParameter (i++);
if (pcEnd <= 0) this.error (22);
}}if (this.tokAt (i) == 269484048) {
params = this.parameterExpressionList (i, -1, false);
i = this.iToken + 1;
}this.checkLength (doStep ? i + 1 : i);
}}if (this.chk && !this.isCmdLine_c_or_C_Option) return;
if (this.isCmdLine_c_or_C_Option) isCheck = true;
var wasSyntaxCheck = this.chk;
var wasScriptCheck = this.isCmdLine_c_or_C_Option;
if (isCheck) this.chk = this.isCmdLine_c_or_C_Option = true;
this.pushContext (null);
this.contextPath += " >> " + filename;
if (theScript == null ? this.compileScriptFileInternal (filename, localPath, remotePath, scriptPath) : this.compileScript (null, theScript, false)) {
this.pcEnd = pcEnd;
this.lineEnd = lineEnd;
while (pc < this.lineNumbers.length && this.lineNumbers[pc] < lineNumber) pc++;

this.pc = pc;
var saveLoadCheck = this.isCmdLine_C_Option;
this.isCmdLine_C_Option = new Boolean (this.isCmdLine_C_Option & loadCheck).valueOf ();
this.executionStepping = new Boolean (this.executionStepping | doStep).valueOf ();
this.contextVariables =  new java.util.Hashtable ();
this.contextVariables.put ("_arguments", (params == null ? J.script.SV.getVariableAI ([]) : J.script.SV.getVariableList (params)));
if (isCheck) this.listCommands = true;
this.dispatchCommands (false, false);
this.isCmdLine_C_Option = saveLoadCheck;
this.popContext (false, false);
} else {
J.util.Logger.error (J.i18n.GT._ ("script ERROR: ") + this.errorMessage);
this.popContext (false, false);
if (wasScriptCheck) {
this.setErrorMessage (null);
} else {
this.evalError (null, null);
}}this.chk = wasSyntaxCheck;
this.isCmdLine_c_or_C_Option = wasScriptCheck;
}, $fz.isPrivate = true, $fz), "~N,~S");
$_M(c$, "$function", 
($fz = function () {
if (this.chk && !this.isCmdLine_c_or_C_Option) return;
var name = this.getToken (0).value;
if (!this.viewer.isFunction (name)) this.error (10);
var params = (this.slen == 1 || this.slen == 3 && this.tokAt (1) == 269484048 && this.tokAt (2) == 269484049 ? null : this.parameterExpressionList (1, -1, false));
if (this.chk) return;
this.runFunctionRet (null, name, params, null, false, true, true);
}, $fz.isPrivate = true, $fz));
$_M(c$, "sync", 
($fz = function () {
this.checkLength (-3);
var text = "";
var applet = "";
switch (this.slen) {
case 1:
applet = "*";
text = "ON";
break;
case 2:
applet = this.parameterAsString (1);
if (applet.indexOf ("jmolApplet") == 0 || J.util.Parser.isOneOf (applet, "*;.;^")) {
text = "ON";
if (!this.chk) this.viewer.syncScript (text, applet, 0);
applet = ".";
break;
}if (this.tokAt (1) == 2) {
if (!this.chk) this.viewer.syncScript (null, null, this.intParameter (1));
return;
}text = applet;
applet = "*";
break;
case 3:
if (this.chk) return;
applet = this.parameterAsString (1);
text = (this.tokAt (2) == 528443 ? "GET_GRAPHICS" : this.parameterAsString (2));
if (this.tokAt (1) == 2) {
this.viewer.syncScript (text, null, this.intParameter (1));
return;
}break;
}
if (this.chk) return;
this.viewer.syncScript (text, applet, 0);
}, $fz.isPrivate = true, $fz));
$_M(c$, "history", 
($fz = function (pt) {
if (this.slen == 1) {
this.showString (this.viewer.getSetHistory (2147483647));
return;
}if (pt == 2) {
var n = this.intParameter (this.checkLast (2));
if (n < 0) this.error (22);
if (!this.chk) this.viewer.getSetHistory (n == 0 ? 0 : -2 - n);
return;
}switch (this.getToken (this.checkLast (1)).tok) {
case 1048589:
case 1073741882:
if (!this.chk) this.viewer.getSetHistory (-2147483648);
return;
case 1048588:
if (!this.chk) this.viewer.getSetHistory (0);
break;
default:
this.errorStr (24, "ON, OFF, CLEAR");
}
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "display", 
($fz = function (isDisplay) {
var bs = null;
var addRemove = null;
var i = 1;
var tok;
switch (tok = this.tokAt (1)) {
case 1276118017:
case 1073742119:
addRemove = Boolean.$valueOf (tok == 1276118017);
tok = this.tokAt (++i);
break;
}
var isGroup = (tok == 1087373318);
if (isGroup) tok = this.tokAt (++i);
switch (tok) {
case 1048583:
this.setObjectProperty ();
return;
case 0:
break;
default:
if (this.slen == 4 && this.tokAt (2) == 1678770178) bs =  new J.modelset.Bond.BondSet (J.util.BSUtil.newBitSet2 (0, this.viewer.modelSet.bondCount));
 else bs = this.atomExpressionAt (i);
}
if (this.chk) return;
if (Clazz.instanceOf (bs, J.modelset.Bond.BondSet)) {
this.viewer.displayBonds (bs, isDisplay);
return;
}this.viewer.displayAtoms (bs, isDisplay, isGroup, addRemove, this.tQuiet);
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "$delete", 
($fz = function () {
if (this.slen == 1) {
this.zap (true);
return;
}if (this.tokAt (1) == 1048583) {
this.setObjectProperty ();
return;
}var bs = this.atomExpression (this.st, 1, 0, true, false, true, false);
if (this.chk) return;
var nDeleted = this.viewer.deleteAtoms (bs, false);
if (!(this.tQuiet || this.scriptLevel > this.scriptReportingLevel)) this.scriptStatusOrBuffer (J.i18n.GT._ ("{0} atoms deleted", nDeleted));
}, $fz.isPrivate = true, $fz));
$_M(c$, "minimize", 
($fz = function () {
var bsSelected = null;
var steps = 2147483647;
var crit = 0;
var addHydrogen = false;
var isSilent = false;
var bsFixed = null;
var minimizer = this.viewer.getMinimizer (false);
for (var i = 1; i < this.slen; i++) switch (this.getToken (i).tok) {
case 1073741828:
addHydrogen = true;
continue;
case 1073741874:
case 1073742162:
this.checkLength (2);
if (this.chk || minimizer == null) return;
minimizer.setProperty (this.parameterAsString (i), null);
return;
case 1073741882:
this.checkLength (2);
if (this.chk || minimizer == null) return;
minimizer.setProperty ("clear", null);
return;
case 1073741894:
if (i != 1) this.error (22);
var n = 0;
var targetValue = 0;
var aList =  Clazz.newIntArray (5, 0);
if (this.tokAt (++i) == 1073741882) {
this.checkLength (3);
} else {
while (n < 4 && !this.isFloatParameter (i)) {
aList[++n] = this.atomExpressionAt (i).nextSetBit (0);
i = this.iToken + 1;
}
aList[0] = n;
if (n == 1) this.error (22);
targetValue = this.floatParameter (this.checkLast (i));
}if (!this.chk) this.viewer.getMinimizer (true).setProperty ("constraint", [aList,  Clazz.newIntArray (n, 0), Float.$valueOf (targetValue)]);
return;
case 1073741905:
crit = this.floatParameter (++i);
continue;
case 1073741935:
steps = 0;
continue;
case 1060869:
if (i != 1) this.error (22);
bsFixed = this.atomExpressionAt (++i);
if (bsFixed.nextSetBit (0) < 0) bsFixed = null;
i = this.iToken;
if (!this.chk) this.viewer.getMinimizer (true).setProperty ("fixed", bsFixed);
if (i + 1 == this.slen) return;
continue;
case 135280132:
bsSelected = this.atomExpressionAt (++i);
i = this.iToken;
continue;
case 1073742148:
isSilent = true;
break;
case 266298:
steps = this.intParameter (++i);
continue;
default:
this.error (22);
break;
}

if (!this.chk) this.viewer.minimize (steps, crit, bsSelected, bsFixed, 0, addHydrogen, isSilent, false);
}, $fz.isPrivate = true, $fz));
$_M(c$, "select", 
($fz = function (i) {
if (this.slen == 1) {
this.viewer.select (null, false, null, this.tQuiet || this.scriptLevel > this.scriptReportingLevel);
return;
}if (this.slen == 2 && this.tokAt (1) == 1073742072) return;
this.viewer.setNoneSelected (this.slen == 4 && this.tokAt (2) == 1048587);
if (this.tokAt (2) == 10 && Clazz.instanceOf (this.getToken (2).value, J.modelset.Bond.BondSet) || this.getToken (2).tok == 1678770178 && this.getToken (3).tok == 10) {
if (this.slen == this.iToken + 2) {
if (!this.chk) this.viewer.selectBonds (this.theToken.value);
return;
}this.error (22);
}if (this.getToken (2).tok == 1746538509) {
if (this.slen == 5 && this.getToken (3).tok == 10) {
if (!this.chk) this.setShapeProperty (6, "select", this.theToken.value);
return;
}this.error (22);
}var bs = null;
var addRemove = null;
var isGroup = false;
if (this.getToken (1).intValue == 0) {
var v = this.parameterExpressionToken (0).value;
if (!(Clazz.instanceOf (v, J.util.BS))) this.error (22);
this.checkLast (this.iToken);
bs = v;
} else {
var tok = this.tokAt (i);
switch (tok) {
case 1276118017:
case 1073742119:
addRemove = Boolean.$valueOf (tok == 1276118017);
tok = this.tokAt (++i);
}
isGroup = (tok == 1087373318);
if (isGroup) tok = this.tokAt (++i);
bs = this.atomExpressionAt (i);
}if (this.chk) return;
if (this.isBondSet) {
this.viewer.selectBonds (bs);
} else {
if (bs.length () > this.viewer.getAtomCount ()) {
var bs1 = this.viewer.getModelUndeletedAtomsBitSet (-1);
bs1.and (bs);
bs = bs1;
}this.viewer.select (bs, isGroup, addRemove, this.tQuiet || this.scriptLevel > this.scriptReportingLevel);
}}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "subset", 
($fz = function () {
var bs = null;
if (!this.chk) this.viewer.setSelectionSubset (null);
if (this.slen != 1 && (this.slen != 4 || !this.getToken (2).value.equals ("off"))) bs = this.atomExpressionAt (1);
if (!this.chk) this.viewer.setSelectionSubset (bs);
}, $fz.isPrivate = true, $fz));
$_M(c$, "invertSelected", 
($fz = function () {
var pt = null;
var plane = null;
var bs = null;
var iAtom = -2147483648;
switch (this.tokAt (1)) {
case 0:
if (this.chk) return;
bs = this.viewer.getSelectionSet (false);
pt = this.viewer.getAtomSetCenter (bs);
this.viewer.invertAtomCoordPt (pt, bs);
return;
case 528443:
iAtom = this.atomExpressionAt (2).nextSetBit (0);
bs = this.atomExpressionAt (this.iToken + 1);
break;
case 135266320:
pt = this.centerParameter (2);
break;
case 135266319:
plane = this.planeParameter (2);
break;
case 135267841:
plane = this.hklParameter (2);
break;
}
this.checkLengthErrorPt (this.iToken + 1, 1);
if (plane == null && pt == null && iAtom == -2147483648) this.error (22);
if (this.chk) return;
if (iAtom == -1) return;
this.viewer.invertSelected (pt, plane, iAtom, bs);
}, $fz.isPrivate = true, $fz));
$_M(c$, "translate", 
($fz = function (isSelected) {
var bs = null;
var i = 1;
var i0 = 0;
if (this.tokAt (1) == 1114638350) {
isSelected = true;
i0 = 1;
i = 2;
}if (this.isPoint3f (i)) {
var pt = this.getPoint3f (i, true);
bs = (!isSelected && this.iToken + 1 < this.slen ? this.atomExpressionAt (++this.iToken) : null);
this.checkLast (this.iToken);
if (!this.chk) this.viewer.setAtomCoordsRelative (pt, bs);
return;
}var xyz = this.parameterAsString (i).toLowerCase ().charAt (0);
if ("xyz".indexOf (xyz) < 0) this.error (0);
var amount = this.floatParameter (++i);
var type;
switch (this.tokAt (++i)) {
case 0:
case 10:
case 1048577:
type = '\0';
break;
default:
type = (this.optParameterAsString (i).toLowerCase () + '\0').charAt (0);
}
if (amount == 0 && type != '\0') return;
this.iToken = i0 + (type == '\0' ? 2 : 3);
bs = (isSelected ? this.viewer.getSelectionSet (false) : this.iToken + 1 < this.slen ? this.atomExpressionAt (++this.iToken) : null);
this.checkLast (this.iToken);
if (!this.chk) this.viewer.translate (xyz, amount, type, bs);
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "zap", 
($fz = function (isZapCommand) {
if (this.slen == 1 || !isZapCommand) {
this.viewer.zap (true, isZapCommand && !this.isStateScript, true);
this.refresh ();
return;
}var bs = this.atomExpressionAt (1);
if (this.chk) return;
var nDeleted = this.viewer.deleteAtoms (bs, true);
var isQuiet = (this.tQuiet || this.scriptLevel > this.scriptReportingLevel);
if (!isQuiet) this.scriptStatusOrBuffer (J.i18n.GT._ ("{0} atoms deleted", nDeleted));
this.viewer.select (null, false, null, isQuiet);
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "zoom", 
($fz = function (isZoomTo) {
if (!isZoomTo) {
var tok = (this.slen > 1 ? this.getToken (1).tok : 1048589);
switch (tok) {
case 1073741980:
case 1073742079:
break;
case 1048589:
case 1048588:
if (this.slen > 2) this.error (2);
if (!this.chk) this.setBooleanProperty ("zoomEnabled", tok == 1048589);
return;
}
}var center = null;
var i = 1;
var floatSecondsTotal = (isZoomTo ? (this.isFloatParameter (i) ? this.floatParameter (i++) : 2) : 0);
if (floatSecondsTotal < 0) {
i--;
floatSecondsTotal = 0;
}var ptCenter = 0;
var bsCenter = null;
if (this.isCenterParameter (i)) {
ptCenter = i;
center = this.centerParameter (i);
if (Clazz.instanceOf (this.expressionResult, J.util.BS)) bsCenter = this.expressionResult;
i = this.iToken + 1;
} else if (this.tokAt (i) == 2 && this.getToken (i).intValue == 0) {
bsCenter = this.viewer.getAtomBitSet ("visible");
center = this.viewer.getAtomSetCenter (bsCenter);
}var isSameAtom = false;
var zoom = this.viewer.getZoomSetting ();
var newZoom = this.getZoom (ptCenter, i, bsCenter, zoom);
i = this.iToken + 1;
var xTrans = NaN;
var yTrans = NaN;
if (i != this.slen) {
xTrans = this.floatParameter (i++);
yTrans = this.floatParameter (i++);
}if (i != this.slen) this.error (22);
if (newZoom < 0) {
newZoom = -newZoom;
if (isZoomTo) {
if (this.slen == 1 || isSameAtom) newZoom *= 2;
 else if (center == null) newZoom /= 2;
}}var max = this.viewer.getMaxZoomPercent ();
if (newZoom < 5 || newZoom > max) this.numberOutOfRange (5, max);
if (!this.viewer.isWindowCentered ()) {
if (center != null) {
var bs = this.atomExpressionAt (ptCenter);
if (!this.chk) this.viewer.setCenterBitSet (bs, false);
}center = this.viewer.getRotationCenter ();
if (Float.isNaN (xTrans)) xTrans = this.viewer.getTranslationXPercent ();
if (Float.isNaN (yTrans)) yTrans = this.viewer.getTranslationYPercent ();
}if (this.chk) return;
if (Float.isNaN (xTrans)) xTrans = 0;
if (Float.isNaN (yTrans)) yTrans = 0;
if (isSameAtom && Math.abs (zoom - newZoom) < 1) floatSecondsTotal = 0;
this.viewer.moveTo (this, floatSecondsTotal, center, J.viewer.JC.center, NaN, null, newZoom, xTrans, yTrans, NaN, null, NaN, NaN, NaN);
if (this.isJS && floatSecondsTotal > 0 && this.viewer.global.waitForMoveTo) throw  new J.script.ScriptInterruption (this, "zoomTo", 1);
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "getZoom", 
($fz = function (ptCenter, i, bs, currentZoom) {
var zoom = (this.isFloatParameter (i) ? this.floatParameter (i++) : NaN);
if (zoom == 0 || currentZoom == 0) {
var r = NaN;
if (bs == null) {
if (this.tokAt (ptCenter) == 1048583) {
var bbox = this.getObjectBoundingBox (this.objectNameParameter (ptCenter + 1));
if (bbox == null || (r = bbox[0].distance (bbox[1]) / 2) == 0) this.error (22);
}} else {
r = this.viewer.calcRotationRadiusBs (bs);
}if (Float.isNaN (r)) this.error (22);
currentZoom = this.viewer.getFloat (570425388) / r * 100;
zoom = NaN;
}if (zoom < 0) {
zoom += currentZoom;
} else if (Float.isNaN (zoom)) {
var tok = this.tokAt (i);
switch (tok) {
case 1073742079:
case 1073741980:
zoom = currentZoom * (tok == 1073742079 ? 0.5 : 2);
i++;
break;
case 269484208:
case 269484209:
case 269484193:
var value = this.floatParameter (++i);
i++;
switch (tok) {
case 269484208:
zoom = currentZoom / value;
break;
case 269484209:
zoom = currentZoom * value;
break;
case 269484193:
zoom = currentZoom + value;
break;
}
break;
default:
zoom = (bs == null ? -currentZoom : currentZoom);
}
}this.iToken = i - 1;
return zoom;
}, $fz.isPrivate = true, $fz), "~N,~N,J.util.BS,~N");
$_M(c$, "delay", 
($fz = function () {
var millis = 0;
switch (this.getToken (1).tok) {
case 1048589:
millis = 1;
break;
case 2:
millis = this.intParameter (1) * 1000;
break;
case 3:
millis = Clazz.floatToInt (this.floatParameter (1) * 1000);
break;
default:
this.error (34);
}
if (this.chk || this.viewer.isHeadless () || this.viewer.autoExit) return;
this.refresh ();
this.doDelay (Math.abs (millis));
}, $fz.isPrivate = true, $fz));
$_M(c$, "slab", 
($fz = function (isDepth) {
var TF = false;
var plane = null;
var str;
if (this.isCenterParameter (1) || this.tokAt (1) == 9) plane = this.planeParameter (1);
 else switch (this.getToken (1).tok) {
case 2:
var percent = this.intParameter (this.checkLast (1));
if (!this.chk) if (isDepth) this.viewer.depthToPercent (percent);
 else this.viewer.slabToPercent (percent);
return;
case 1048589:
this.checkLength (2);
TF = true;
case 1048588:
this.checkLength (2);
this.setBooleanProperty ("slabEnabled", TF);
return;
case 4141:
this.checkLength (2);
if (this.chk) return;
this.viewer.slabReset ();
this.setBooleanProperty ("slabEnabled", true);
return;
case 1085443:
this.checkLength (2);
if (this.chk) return;
this.viewer.setSlabDepthInternal (isDepth);
this.setBooleanProperty ("slabEnabled", true);
return;
case 269484192:
str = this.parameterAsString (2);
if (str.equalsIgnoreCase ("hkl")) plane = this.hklParameter (3);
 else if (str.equalsIgnoreCase ("plane")) plane = this.planeParameter (3);
if (plane == null) this.error (22);
plane.scale (-1);
break;
case 135266319:
switch (this.getToken (2).tok) {
case 1048587:
break;
default:
plane = this.planeParameter (2);
}
break;
case 135267841:
plane = (this.getToken (2).tok == 1048587 ? null : this.hklParameter (2));
break;
case 1073742118:
return;
default:
this.error (22);
}
if (!this.chk) this.viewer.slabInternal (plane, isDepth);
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "ellipsoid", 
($fz = function () {
var mad = 0;
var i = 1;
switch (this.getToken (1).tok) {
case 1048589:
mad = 50;
break;
case 1048588:
break;
case 2:
mad = this.intParameter (1);
break;
case 1085443:
this.checkLength (3);
this.sm.loadShape (20);
this.setShapeProperty (20, "select", Integer.$valueOf (this.intParameterRange (2, 1, 3)));
return;
case 1074790550:
case 269484209:
case 1073741824:
this.sm.loadShape (20);
if (this.theTok == 1074790550) i++;
this.setShapeId (20, i, false);
i = this.iToken;
while (++i < this.slen) {
var key = this.parameterAsString (i);
var value = null;
switch (this.tokAt (i)) {
case 1048583:
key = "points";
var data =  new Array (3);
data[0] = this.objectNameParameter (++i);
if (this.chk) continue;
this.getShapePropertyData (24, "getVertices", data);
value = data;
break;
case 10:
case 1048577:
key = "atoms";
value = this.atomExpressionAt (i);
i = this.iToken;
break;
case 1611272194:
var axes =  new Array (3);
for (var j = 0; j < 3; j++) {
axes[j] =  new J.util.V3 ();
axes[j].setT (this.centerParameter (++i));
i = this.iToken;
}
value = axes;
break;
case 12289:
value = this.centerParameter (++i);
i = this.iToken;
break;
case 1766856708:
var translucentLevel = NaN;
if (this.tokAt (i) == 1766856708) i++;
if ((this.theTok = this.tokAt (i)) == 1073742180) {
value = "translucent";
if (this.isFloatParameter (++i)) translucentLevel = this.getTranslucentLevel (i++);
 else translucentLevel = this.viewer.getFloat (570425354);
} else if (this.theTok == 1073742074) {
value = "opaque";
i++;
}if (this.isColorParam (i)) {
this.setShapeProperty (20, "color", Integer.$valueOf (this.getArgbParam (i)));
i = this.iToken;
}if (value == null) continue;
if (!Float.isNaN (translucentLevel)) this.setShapeProperty (20, "translucentLevel", Float.$valueOf (translucentLevel));
key = "translucency";
break;
case 12291:
value = Boolean.TRUE;
this.checkLength (3);
break;
case 1095761933:
value = Integer.$valueOf (this.intParameter (++i));
break;
case 1048589:
value = Boolean.TRUE;
break;
case 1048588:
key = "on";
value = Boolean.FALSE;
break;
case 1073742138:
value = Float.$valueOf (this.floatParameter (++i));
break;
}
if (value == null) this.error (22);
this.setShapeProperty (20, key.toLowerCase (), value);
}
this.setShapeProperty (20, "thisID", null);
return;
default:
this.error (22);
}
this.setShapeSizeBs (20, mad, null);
}, $fz.isPrivate = true, $fz));
$_M(c$, "getShapeNameParameter", 
($fz = function (i) {
var id = this.parameterAsString (i);
var isWild = id.equals ("*");
if (id.length == 0) this.error (22);
if (isWild) {
switch (this.tokAt (i + 1)) {
case 0:
case 1048589:
case 1048588:
case 3145768:
case 3145770:
case 1766856708:
case 12291:
break;
default:
if (this.setMeshDisplayProperty (-1, 0, this.tokAt (i + 1))) break;
id += this.optParameterAsString (++i);
}
}if (this.tokAt (i + 1) == 269484209) id += this.parameterAsString (++i);
this.iToken = i;
return id;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "setShapeId", 
($fz = function (iShape, i, idSeen) {
if (idSeen) this.error (22);
var name = this.getShapeNameParameter (i).toLowerCase ();
this.setShapeProperty (iShape, "thisID", name);
return name;
}, $fz.isPrivate = true, $fz), "~N,~N,~B");
$_M(c$, "setAtomShapeSize", 
($fz = function (shape, scale) {
var rd = null;
var tok = this.tokAt (1);
var isOnly = false;
switch (tok) {
case 1073742072:
this.restrictSelected (false, false);
break;
case 1048589:
break;
case 1048588:
scale = 0;
break;
case 3:
isOnly = (this.floatParameter (1) < 0);
case 2:
default:
rd = this.encodeRadiusParameter (1, isOnly, true);
if (Float.isNaN (rd.value)) this.error (22);
}
if (rd == null) rd =  new J.atomdata.RadiusData (null, scale, J.atomdata.RadiusData.EnumType.FACTOR, J.constant.EnumVdw.AUTO);
if (isOnly) this.restrictSelected (false, false);
this.setShapeSize (shape, rd);
}, $fz.isPrivate = true, $fz), "~N,~N");
$_M(c$, "encodeRadiusParameter", 
($fz = function (index, isOnly, allowAbsolute) {
var value = NaN;
var factorType = J.atomdata.RadiusData.EnumType.ABSOLUTE;
var vdwType = null;
var tok = (index == -1 ? 1649412112 : this.getToken (index).tok);
switch (tok) {
case 1112539137:
case 1112539138:
case 1112541195:
case 1114638346:
case 1112541199:
case 1649412112:
value = 1;
factorType = J.atomdata.RadiusData.EnumType.FACTOR;
vdwType = (tok == 1649412112 ? null : J.constant.EnumVdw.getVdwType2 (J.script.T.nameOf (tok)));
tok = this.tokAt (++index);
break;
}
switch (tok) {
case 4141:
return this.viewer.getDefaultRadiusData ();
case 1073741852:
case 1073742116:
case 1073741856:
case 1073741858:
case 1073741992:
value = 1;
factorType = J.atomdata.RadiusData.EnumType.FACTOR;
this.iToken = index - 1;
break;
case 269484193:
case 2:
case 3:
if (tok == 269484193) {
index++;
} else if (this.tokAt (index + 1) == 269484210) {
value = Math.round (this.floatParameter (index));
this.iToken = ++index;
factorType = J.atomdata.RadiusData.EnumType.FACTOR;
if (value < 0 || value > 200) this.integerOutOfRange (0, 200);
value /= 100;
break;
} else if (tok == 2) {
value = this.intParameter (index);
if (value > 749 || value < -200) this.integerOutOfRange (-200, 749);
if (value > 0) {
value /= 250;
factorType = J.atomdata.RadiusData.EnumType.ABSOLUTE;
} else {
value /= -100;
factorType = J.atomdata.RadiusData.EnumType.FACTOR;
}break;
}value = this.floatParameterRange (index, (isOnly || !allowAbsolute ? -16 : 0), 16);
if (tok == 269484193 || !allowAbsolute) {
factorType = J.atomdata.RadiusData.EnumType.OFFSET;
} else {
factorType = J.atomdata.RadiusData.EnumType.ABSOLUTE;
vdwType = J.constant.EnumVdw.NADA;
}if (isOnly) value = -value;
break;
default:
if (value == 1) index--;
}
if (vdwType == null) {
vdwType = J.constant.EnumVdw.getVdwType (this.optParameterAsString (++this.iToken));
if (vdwType == null) {
this.iToken = index;
vdwType = J.constant.EnumVdw.AUTO;
}}return  new J.atomdata.RadiusData (null, value, factorType, vdwType);
}, $fz.isPrivate = true, $fz), "~N,~B,~B");
$_M(c$, "structure", 
($fz = function () {
var type = J.constant.EnumStructure.getProteinStructureType (this.parameterAsString (1));
if (type === J.constant.EnumStructure.NOT) this.error (22);
var bs = null;
switch (this.tokAt (2)) {
case 10:
case 1048577:
bs = this.atomExpressionAt (2);
this.checkLast (this.iToken);
break;
default:
this.checkLength (2);
}
if (this.chk) return;
this.clearDefinedVariableAtomSets ();
this.viewer.setProteinType (type, bs);
}, $fz.isPrivate = true, $fz));
$_M(c$, "wireframe", 
($fz = function () {
var mad = -2147483648;
if (this.tokAt (1) == 4141) this.checkLast (1);
 else mad = this.getMadParameter ();
if (this.chk) return;
this.setShapeProperty (1, "type", Integer.$valueOf (1023));
this.setShapeSizeBs (1, mad == -2147483648 ? 300 : mad, null);
}, $fz.isPrivate = true, $fz));
$_M(c$, "ssbond", 
($fz = function () {
var mad = this.getMadParameter ();
this.setShapeProperty (1, "type", Integer.$valueOf (256));
this.setShapeSizeBs (1, mad, null);
this.setShapeProperty (1, "type", Integer.$valueOf (1023));
}, $fz.isPrivate = true, $fz));
$_M(c$, "struts", 
($fz = function () {
var defOn = (this.tokAt (1) == 1073742072 || this.tokAt (1) == 1048589 || this.slen == 1);
var mad = this.getMadParameter ();
if (defOn) mad = Math.round (this.viewer.getFloat (570425406) * 2000);
this.setShapeProperty (1, "type", Integer.$valueOf (32768));
this.setShapeSizeBs (1, mad, null);
this.setShapeProperty (1, "type", Integer.$valueOf (1023));
}, $fz.isPrivate = true, $fz));
$_M(c$, "hbond", 
($fz = function () {
if (this.slen == 2 && this.getToken (1).tok == 4102) {
if (this.chk) return;
var n = this.viewer.autoHbond (null, null, false);
this.scriptStatusOrBuffer (J.i18n.GT._ ("{0} hydrogen bonds", Math.abs (n)));
return;
}if (this.slen == 2 && this.getToken (1).tok == 12291) {
if (this.chk) return;
this.connect (0);
return;
}var mad = this.getMadParameter ();
this.setShapeProperty (1, "type", Integer.$valueOf (30720));
this.setShapeSizeBs (1, mad, null);
this.setShapeProperty (1, "type", Integer.$valueOf (1023));
}, $fz.isPrivate = true, $fz));
$_M(c$, "configuration", 
($fz = function () {
var bsAtoms;
if (this.slen == 1) {
bsAtoms = this.viewer.setConformation ();
this.viewer.addStateScriptRet ("select", null, this.viewer.getSelectionSet (false), null, "configuration", true, false);
} else {
var n = this.intParameter (this.checkLast (1));
if (this.chk) return;
bsAtoms = this.viewer.getConformation (this.viewer.getCurrentModelIndex (), n - 1, true);
this.viewer.addStateScript ("configuration " + n + ";", true, false);
}if (this.chk) return;
this.setShapeProperty (1, "type", Integer.$valueOf (30720));
this.setShapeSizeBs (1, 0, bsAtoms);
this.viewer.autoHbond (bsAtoms, bsAtoms, true);
this.viewer.select (bsAtoms, false, null, this.tQuiet);
}, $fz.isPrivate = true, $fz));
$_M(c$, "vector", 
($fz = function () {
var type = J.atomdata.RadiusData.EnumType.SCREEN;
var value = 1;
this.checkLength (-3);
switch (this.iToken = this.slen) {
case 1:
break;
case 2:
switch (this.getToken (1).tok) {
case 1048589:
break;
case 1048588:
value = 0;
break;
case 2:
value = this.intParameterRange (1, 0, 19);
break;
case 3:
type = J.atomdata.RadiusData.EnumType.ABSOLUTE;
value = this.floatParameterRange (1, 0, 3);
break;
default:
this.error (6);
}
break;
case 3:
if (this.tokAt (1) == 1073742138) {
this.setFloatProperty ("vectorScale", this.floatParameterRange (2, -100, 100));
return;
}}
this.setShapeSize (18,  new J.atomdata.RadiusData (null, value, type, null));
}, $fz.isPrivate = true, $fz));
$_M(c$, "dipole", 
($fz = function () {
var propertyName = null;
var propertyValue = null;
var iHaveAtoms = false;
var iHaveCoord = false;
var idSeen = false;
this.sm.loadShape (17);
if (this.tokAt (1) == 1073742001 && this.listIsosurface (17)) return;
this.setShapeProperty (17, "init", null);
if (this.slen == 1) {
this.setShapeProperty (17, "thisID", null);
return;
}for (var i = 1; i < this.slen; ++i) {
propertyName = null;
propertyValue = null;
switch (this.getToken (i).tok) {
case 1048589:
propertyName = "on";
break;
case 1048588:
propertyName = "off";
break;
case 12291:
propertyName = "delete";
break;
case 2:
case 3:
propertyName = "value";
propertyValue = Float.$valueOf (this.floatParameter (i));
break;
case 10:
propertyName = "atomBitset";
case 1048577:
if (propertyName == null) propertyName = (iHaveAtoms || iHaveCoord ? "endSet" : "startSet");
propertyValue = this.atomExpressionAt (i);
i = this.iToken;
iHaveAtoms = true;
break;
case 1048586:
case 8:
var pt = this.getPoint3f (i, true);
i = this.iToken;
propertyName = (iHaveAtoms || iHaveCoord ? "endCoord" : "startCoord");
propertyValue = pt;
iHaveCoord = true;
break;
case 1678770178:
propertyName = "bonds";
break;
case 4102:
propertyName = "calculate";
break;
case 1074790550:
this.setShapeId (17, ++i, idSeen);
i = this.iToken;
break;
case 135267329:
propertyName = "cross";
propertyValue = Boolean.TRUE;
break;
case 1073742040:
propertyName = "cross";
propertyValue = Boolean.FALSE;
break;
case 1073742066:
var v = this.floatParameter (++i);
if (this.theTok == 2) {
propertyName = "offsetPercent";
propertyValue = Integer.$valueOf (Clazz.floatToInt (v));
} else {
propertyName = "offset";
propertyValue = Float.$valueOf (v);
}break;
case 1073742068:
propertyName = "offsetSide";
propertyValue = Float.$valueOf (this.floatParameter (++i));
break;
case 1073742188:
propertyName = "value";
propertyValue = Float.$valueOf (this.floatParameter (++i));
break;
case 1073742196:
propertyName = "width";
propertyValue = Float.$valueOf (this.floatParameter (++i));
break;
default:
if (this.theTok == 269484209 || J.script.T.tokAttr (this.theTok, 1073741824)) {
this.setShapeId (17, i, idSeen);
i = this.iToken;
break;
}this.error (22);
}
idSeen = (this.theTok != 12291 && this.theTok != 4102);
if (propertyName != null) this.setShapeProperty (17, propertyName, propertyValue);
}
if (iHaveCoord || iHaveAtoms) this.setShapeProperty (17, "set", null);
}, $fz.isPrivate = true, $fz));
$_M(c$, "animationMode", 
($fz = function () {
var startDelay = 1;
var endDelay = 1;
if (this.slen > 5) this.error (2);
var animationMode = null;
switch (this.getToken (2).tok) {
case 1073742070:
animationMode = J.constant.EnumAnimationMode.ONCE;
startDelay = endDelay = 0;
break;
case 528410:
animationMode = J.constant.EnumAnimationMode.LOOP;
break;
case 1073742082:
animationMode = J.constant.EnumAnimationMode.PALINDROME;
break;
default:
this.error (22);
}
if (this.slen >= 4) {
startDelay = endDelay = this.floatParameter (3);
if (this.slen == 5) endDelay = this.floatParameter (4);
}if (!this.chk) this.viewer.setAnimationReplayMode (animationMode, startDelay, endDelay);
}, $fz.isPrivate = true, $fz));
$_M(c$, "vibration", 
($fz = function () {
this.checkLength (-3);
var period = 0;
switch (this.getToken (1).tok) {
case 1048589:
this.checkLength (2);
period = this.viewer.getFloat (570425412);
break;
case 1048588:
this.checkLength (2);
period = 0;
break;
case 2:
case 3:
this.checkLength (2);
period = this.floatParameter (1);
break;
case 1073742138:
this.setFloatProperty ("vibrationScale", this.floatParameterRange (2, -10, 10));
return;
case 1073742090:
this.setFloatProperty ("vibrationPeriod", this.floatParameter (2));
return;
case 1073741824:
this.error (22);
break;
default:
period = -1;
}
if (period < 0) this.error (22);
if (this.chk) return;
if (period == 0) {
this.viewer.setVibrationOff ();
return;
}this.viewer.setVibrationPeriod (-period);
}, $fz.isPrivate = true, $fz));
$_M(c$, "animationDirection", 
($fz = function () {
var i = 2;
var direction = 0;
switch (this.tokAt (i)) {
case 269484192:
direction = -this.intParameter (++i);
break;
case 269484193:
direction = this.intParameter (++i);
break;
case 2:
direction = this.intParameter (i);
if (direction > 0) direction = 0;
break;
default:
this.error (22);
}
this.checkLength (++i);
if (direction != 1 && direction != -1) this.errorStr2 (35, "-1", "1");
if (!this.chk) this.viewer.setAnimationDirection (direction);
}, $fz.isPrivate = true, $fz));
$_M(c$, "calculate", 
($fz = function () {
var isSurface = false;
var asDSSP = false;
var bs;
var bs2 = null;
var n = -2147483648;
if ((this.iToken = this.slen) >= 2) {
this.clearDefinedVariableAtomSets ();
switch (this.getToken (1).tok) {
case 1073741824:
this.checkLength (2);
break;
case 1076887572:
this.checkLength (2);
if (!this.chk) this.viewer.assignAromaticBonds ();
return;
case 1612189718:
if (this.slen == 2) {
if (!this.chk) {
n = this.viewer.autoHbond (null, null, false);
break;
}return;
}var bs1 = null;
asDSSP = (this.tokAt (++this.iToken) == 1641025539);
if (asDSSP) bs1 = this.viewer.getSelectionSet (false);
 else bs1 = this.atomExpressionAt (this.iToken);
if (!asDSSP && !(asDSSP = (this.tokAt (++this.iToken) == 1641025539))) bs2 = this.atomExpressionAt (this.iToken);
if (!this.chk) {
n = this.viewer.autoHbond (bs1, bs2, false);
break;
}return;
case 1613758476:
bs = (this.slen == 2 ? null : this.atomExpressionAt (2));
this.checkLast (this.iToken);
if (!this.chk) this.viewer.addHydrogens (bs, false, false);
return;
case 1112541196:
this.iToken = 1;
bs = (this.slen == 2 ? null : this.atomExpressionAt (2));
this.checkLast (this.iToken);
if (!this.chk) this.viewer.calculatePartialCharges (bs);
return;
case 1073742102:
this.pointGroup ();
return;
case 1112539148:
this.checkLength (2);
if (!this.chk) {
this.viewer.calculateStraightness ();
this.viewer.addStateScript ("set quaternionFrame '" + this.viewer.getQuaternionFrame () + "'; calculate straightness", false, true);
}return;
case 1641025539:
bs = (this.slen < 4 ? null : this.atomExpressionAt (2));
switch (this.tokAt (++this.iToken)) {
case 1052714:
break;
case 1073741915:
asDSSP = true;
break;
case 0:
asDSSP = this.viewer.getBoolean (603979825);
break;
default:
this.error (22);
}
if (!this.chk) this.showString (this.viewer.calculateStructures (bs, asDSSP, true));
return;
case 1708058:
bs = (this.iToken + 1 < this.slen ? this.atomExpressionAt (++this.iToken) : null);
bs2 = (this.iToken + 1 < this.slen ? this.atomExpressionAt (++this.iToken) : null);
this.checkLength (++this.iToken);
if (!this.chk) {
n = this.viewer.calculateStruts (bs, bs2);
if (n > 0) {
this.setShapeProperty (1, "type", Integer.$valueOf (32768));
this.setShapePropertyBs (1, "color", Integer.$valueOf (0x0FFFFFF), null);
this.setShapeTranslucency (1, "", "translucent", 0.5, null);
this.setShapeProperty (1, "type", Integer.$valueOf (1023));
}this.showString (J.i18n.GT._ ("{0} struts added", n));
}return;
case 3145756:
isSurface = true;
case 1112539149:
var isFrom = false;
switch (this.tokAt (2)) {
case 135266324:
this.iToken++;
break;
case 0:
isFrom = !isSurface;
break;
case 1073741952:
isFrom = true;
this.iToken++;
break;
default:
isFrom = true;
}
bs = (this.iToken + 1 < this.slen ? this.atomExpressionAt (++this.iToken) : this.viewer.getSelectionSet (false));
this.checkLength (++this.iToken);
if (!this.chk) this.viewer.calculateSurface (bs, (isFrom ? 3.4028235E38 : -1));
return;
}
if (n != -2147483648) {
this.scriptStatusOrBuffer (J.i18n.GT._ ("{0} hydrogen bonds", Math.abs (n)));
return;
}}this.errorStr2 (53, "CALCULATE", "aromatic? hbonds? hydrogen? partialCharge? pointgroup? straightness? structure? struts? surfaceDistance FROM? surfaceDistance WITHIN?");
}, $fz.isPrivate = true, $fz));
$_M(c$, "pointGroup", 
($fz = function () {
switch (this.tokAt (0)) {
case 4102:
if (!this.chk) this.showString (this.viewer.calculatePointGroup ());
return;
case 4148:
if (!this.chk) this.showString (this.viewer.getPointGroupAsString (false, null, 0, 0));
return;
}
var pt = 2;
var type = (this.tokAt (pt) == 1073742138 ? "" : this.optParameterAsString (pt));
var scale = 1;
var index = 0;
if (type.length > 0) {
if (this.isFloatParameter (++pt)) index = this.intParameter (pt++);
}if (this.tokAt (pt) == 1073742138) scale = this.floatParameter (++pt);
if (!this.chk) this.runScript (this.viewer.getPointGroupAsString (true, type, index, scale));
}, $fz.isPrivate = true, $fz));
$_M(c$, "dots", 
($fz = function (iShape) {
if (!this.chk) this.sm.loadShape (iShape);
this.setShapeProperty (iShape, "init", null);
var value = NaN;
var type = J.atomdata.RadiusData.EnumType.ABSOLUTE;
var ipt = 1;
while (true) {
switch (this.getToken (ipt).tok) {
case 1073742072:
this.restrictSelected (false, false);
value = 1;
type = J.atomdata.RadiusData.EnumType.FACTOR;
break;
case 1048589:
value = 1;
type = J.atomdata.RadiusData.EnumType.FACTOR;
break;
case 1048588:
value = 0;
break;
case 1073741976:
this.setShapeProperty (iShape, "ignore", this.atomExpressionAt (ipt + 1));
ipt = this.iToken + 1;
continue;
case 2:
var dotsParam = this.intParameter (ipt);
if (this.tokAt (ipt + 1) == 1666189314) {
ipt++;
this.setShapeProperty (iShape, "atom", Integer.$valueOf (dotsParam));
this.setShapeProperty (iShape, "radius", Float.$valueOf (this.floatParameter (++ipt)));
if (this.tokAt (++ipt) == 1766856708) {
this.setShapeProperty (iShape, "colorRGB", Integer.$valueOf (this.getArgbParam (++ipt)));
ipt++;
}if (this.getToken (ipt).tok != 10) this.error (22);
this.setShapeProperty (iShape, "dots", this.st[ipt].value);
return;
}break;
}
break;
}
var rd = (Float.isNaN (value) ? this.encodeRadiusParameter (ipt, false, true) :  new J.atomdata.RadiusData (null, value, type, J.constant.EnumVdw.AUTO));
if (Float.isNaN (rd.value)) this.error (22);
this.setShapeSize (iShape, rd);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "proteinShape", 
($fz = function (shapeType) {
var mad = 0;
switch (this.getToken (1).tok) {
case 1073742072:
if (this.chk) return;
this.restrictSelected (false, false);
mad = -1;
break;
case 1048589:
mad = -1;
break;
case 1048588:
break;
case 1641025539:
mad = -2;
break;
case 1112541199:
case 1073741922:
mad = -4;
break;
case 2:
mad = (this.intParameterRange (1, 0, 1000) * 8);
break;
case 3:
mad = Math.round (this.floatParameterRange (1, -4.0, 4.0) * 2000);
if (mad < 0) {
this.restrictSelected (false, false);
mad = -mad;
}break;
case 10:
if (!this.chk) this.sm.loadShape (shapeType);
this.setShapeProperty (shapeType, "bitset", this.theToken.value);
return;
default:
this.error (6);
}
this.setShapeSizeBs (shapeType, mad, null);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "animation", 
($fz = function () {
var animate = false;
switch (this.getToken (1).tok) {
case 1048589:
animate = true;
case 1048588:
if (!this.chk) this.viewer.setAnimationOn (animate);
break;
case 1073742031:
var morphCount = Clazz.floatToInt (this.floatParameter (2));
if (!this.chk) this.viewer.setAnimMorphCount (Math.abs (morphCount));
break;
case 1610625028:
this.iToken = 2;
var bs = (this.tokAt (2) == 1048579 ? null : this.atomExpressionAt (2));
this.checkLength (this.iToken + 1);
if (!this.chk) this.viewer.setAnimDisplay (bs);
return;
case 4115:
this.frame (2);
break;
case 1073742024:
this.animationMode ();
break;
case 1073741918:
this.animationDirection ();
break;
case 1074790526:
this.setIntProperty ("animationFps", this.intParameter (this.checkLast (2)));
break;
default:
this.frameControl (1);
}
}, $fz.isPrivate = true, $fz));
$_M(c$, "assign", 
($fz = function () {
var atomsOrBonds = this.tokAt (1);
var index = this.atomExpressionAt (2).nextSetBit (0);
var index2 = -1;
var type = null;
if (index < 0) return;
if (atomsOrBonds == 4106) {
index2 = this.atomExpressionAt (++this.iToken).nextSetBit (0);
} else {
type = this.parameterAsString (++this.iToken);
}var pt = (++this.iToken < this.slen ? this.centerParameter (this.iToken) : null);
if (this.chk) return;
switch (atomsOrBonds) {
case 1141899265:
this.clearDefinedVariableAtomSets ();
this.viewer.assignAtom (index, pt, type);
break;
case 1678770178:
this.viewer.assignBond (index, (type + "p").charAt (0));
break;
case 4106:
this.viewer.assignConnect (index, index2);
}
}, $fz.isPrivate = true, $fz));
$_M(c$, "file", 
($fz = function () {
var file = this.intParameter (this.checkLast (1));
if (this.chk) return;
var modelIndex = this.viewer.getModelNumberIndex (file * 1000000 + 1, false, false);
var modelIndex2 = -1;
if (modelIndex >= 0) {
modelIndex2 = this.viewer.getModelNumberIndex ((file + 1) * 1000000 + 1, false, false);
if (modelIndex2 < 0) modelIndex2 = this.viewer.getModelCount ();
modelIndex2--;
}this.viewer.setAnimationOn (false);
this.viewer.setAnimationDirection (1);
this.viewer.setAnimationRange (modelIndex, modelIndex2);
this.viewer.setCurrentModelIndex (-1);
}, $fz.isPrivate = true, $fz));
$_M(c$, "fixed", 
($fz = function () {
var bs = (this.slen == 1 ? null : this.atomExpressionAt (1));
if (this.chk) return;
this.viewer.setMotionFixedAtoms (bs);
}, $fz.isPrivate = true, $fz));
$_M(c$, "frame", 
($fz = function (offset) {
var useModelNumber = true;
if (this.slen == 1 && offset == 1) {
var modelIndex = this.viewer.getCurrentModelIndex ();
var m;
if (!this.chk && modelIndex >= 0 && (m = this.viewer.getJmolDataSourceFrame (modelIndex)) >= 0) this.viewer.setCurrentModelIndex (m == modelIndex ? -2147483648 : m);
return;
}switch (this.tokAt (1)) {
case 1048577:
case 10:
var i = this.atomExpressionAt (1).nextSetBit (0);
this.checkLength (this.iToken + 1);
if (this.chk || i < 0) return;
var bsa =  new J.util.BS ();
bsa.set (i);
this.viewer.setCurrentModelIndex (this.viewer.getModelBitSet (bsa, false).nextSetBit (0));
return;
case 1073741904:
this.iToken = 1;
var n = (this.tokAt (2) == 2 ? this.intParameter (++this.iToken) : 1);
this.checkLength (this.iToken + 1);
if (!this.chk && n > 0) this.viewer.createModels (n);
return;
case 1074790550:
this.checkLength (3);
var id = this.stringParameter (2);
if (!this.chk) this.viewer.setCurrentModelID (id);
return;
case 528397:
var millis = 0;
this.checkLength (3);
switch (this.getToken (2).tok) {
case 2:
case 3:
millis = Clazz.floatToLong (this.floatParameter (2) * 1000);
break;
default:
this.error (20);
}
if (!this.chk) this.viewer.setFrameDelayMs (millis);
return;
case 1073742166:
if (this.checkLength23 () > 0) if (!this.chk) this.viewer.setFrameTitleObj (this.slen == 2 ? "@{_modelName}" : (this.tokAt (2) == 7 ? J.script.SV.listValue (this.st[2]) : this.parameterAsString (2)));
return;
case 1073741832:
var bs = (this.slen == 2 || this.tokAt (2) == 1048587 ? null : this.atomExpressionAt (2));
if (!this.chk) this.viewer.setFrameOffsets (bs);
return;
}
if (this.getToken (offset).tok == 269484192) {
++offset;
if (this.getToken (this.checkLast (offset)).tok != 2 || this.intParameter (offset) != 1) this.error (22);
if (!this.chk) this.viewer.setAnimation (1073742108);
return;
}var isPlay = false;
var isRange = false;
var isAll = false;
var isHyphen = false;
var frameList = [-1, -1];
var nFrames = 0;
var fFrame = 0;
var haveFileSet = this.viewer.haveFileSet ();
for (var i = offset; i < this.slen; i++) {
switch (this.getToken (i).tok) {
case 1048579:
case 269484209:
this.checkLength (offset + (isRange ? 2 : 1));
isAll = true;
break;
case 269484192:
if (nFrames != 1) this.error (22);
isHyphen = true;
break;
case 1048587:
this.checkLength (offset + 1);
break;
case 3:
useModelNumber = false;
if ((fFrame = this.floatParameter (i)) < 0) {
this.checkLength (i + 1);
if (!this.chk) this.viewer.morph (-fFrame);
return;
}case 2:
case 4:
if (nFrames == 2) this.error (22);
var iFrame = (this.theTok == 4 ? J.script.ScriptEvaluator.getFloatEncodedInt (this.theToken.value) : this.theToken.intValue);
if (iFrame < 0 && nFrames == 1) {
isHyphen = true;
iFrame = -iFrame;
if (haveFileSet && iFrame < 1000000) iFrame *= 1000000;
}if (this.theTok == 3 && haveFileSet && fFrame == Clazz.floatToInt (fFrame)) iFrame = Clazz.floatToInt (fFrame) * 1000000;
if (iFrame == 2147483647) {
if (i == 1) {
var id = this.theToken.value.toString ();
var modelIndex = (this.chk ? -1 : this.viewer.getModelIndexFromId (id));
if (modelIndex >= 0) {
this.checkLength (2);
this.viewer.setCurrentModelIndex (modelIndex);
return;
}}iFrame = 0;
}if (iFrame == -1) {
this.checkLength (offset + 1);
if (!this.chk) this.viewer.setAnimation (1073742108);
return;
}if (iFrame >= 1000 && iFrame < 1000000 && haveFileSet) iFrame = (Clazz.doubleToInt (iFrame / 1000)) * 1000000 + (iFrame % 1000);
if (!useModelNumber && iFrame == 0 && nFrames == 0) isAll = true;
if (iFrame >= 1000000) useModelNumber = false;
frameList[nFrames++] = iFrame;
break;
case 1073742096:
isPlay = true;
break;
case 1073742114:
isRange = true;
break;
default:
this.frameControl (offset);
return;
}
}
if (isRange && nFrames == 0) isAll = true;
if (this.chk) return;
if (isAll) {
this.viewer.setAnimationOn (false);
this.viewer.setAnimationRange (-1, -1);
if (!isRange) this.viewer.setCurrentModelIndex (-1);
return;
}if (nFrames == 2 && !isRange) isHyphen = true;
if (haveFileSet) useModelNumber = false;
 else if (useModelNumber) for (var i = 0; i < nFrames; i++) if (frameList[i] >= 0) frameList[i] %= 1000000;

var modelIndex = this.viewer.getModelNumberIndex (frameList[0], useModelNumber, false);
var modelIndex2 = -1;
if (haveFileSet && modelIndex < 0 && frameList[0] != 0) {
if (frameList[0] < 1000000) frameList[0] *= 1000000;
if (nFrames == 2 && frameList[1] < 1000000) frameList[1] *= 1000000;
if (frameList[0] % 1000000 == 0) {
frameList[0]++;
modelIndex = this.viewer.getModelNumberIndex (frameList[0], false, false);
if (modelIndex >= 0) {
var i2 = (nFrames == 1 ? frameList[0] + 1000000 : frameList[1] == 0 ? -1 : frameList[1] % 1000000 == 0 ? frameList[1] + 1000001 : frameList[1] + 1);
modelIndex2 = this.viewer.getModelNumberIndex (i2, false, false);
if (modelIndex2 < 0) modelIndex2 = this.viewer.getModelCount ();
modelIndex2--;
if (isRange) nFrames = 2;
 else if (!isHyphen && modelIndex2 != modelIndex) isHyphen = true;
isRange = isRange || modelIndex == modelIndex2;
}} else {
return;
}}if (!isPlay && !isRange || modelIndex >= 0) this.viewer.setCurrentModelIndexClear (modelIndex, false);
if (isPlay && nFrames == 2 || isRange || isHyphen) {
if (modelIndex2 < 0) modelIndex2 = this.viewer.getModelNumberIndex (frameList[1], useModelNumber, false);
this.viewer.setAnimationOn (false);
this.viewer.setAnimationDirection (1);
this.viewer.setAnimationRange (modelIndex, modelIndex2);
this.viewer.setCurrentModelIndexClear (isHyphen && !isRange ? -1 : modelIndex >= 0 ? modelIndex : 0, false);
}if (isPlay) this.viewer.setAnimation (266287);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "bitSetForModelFileNumber", 
function (m) {
var bs = J.util.BSUtil.newBitSet (this.viewer.getAtomCount ());
if (this.chk) return bs;
var modelCount = this.viewer.getModelCount ();
var haveFileSet = this.viewer.haveFileSet ();
if (m < 1000000 && haveFileSet) m *= 1000000;
var pt = m % 1000000;
if (pt == 0) {
var model1 = this.viewer.getModelNumberIndex (m + 1, false, false);
if (model1 < 0) return bs;
var model2 = (m == 0 ? modelCount : this.viewer.getModelNumberIndex (m + 1000001, false, false));
if (model1 < 0) model1 = 0;
if (model2 < 0) model2 = modelCount;
if (this.viewer.isTrajectory (model1)) model2 = model1 + 1;
for (var j = model1; j < model2; j++) bs.or (this.viewer.getModelUndeletedAtomsBitSet (j));

} else {
var modelIndex = this.viewer.getModelNumberIndex (m, false, true);
if (modelIndex >= 0) bs.or (this.viewer.getModelUndeletedAtomsBitSet (modelIndex));
}return bs;
}, "~N");
$_M(c$, "frameControl", 
($fz = function (i) {
switch (this.getToken (this.checkLast (i)).tok) {
case 1073742098:
case 1073742096:
case 266287:
case 20487:
case 1073742037:
case 1073742108:
case 1073742126:
case 1073741942:
case 1073741993:
if (!this.chk) this.viewer.setAnimation (this.theTok);
return;
}
this.error (22);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "getShapeType", 
($fz = function (tok) {
var iShape = J.viewer.JC.shapeTokenIndex (tok);
if (iShape < 0) this.error (49);
return iShape;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "font", 
($fz = function (shapeType, fontsize) {
var fontface = "SansSerif";
var fontstyle = "Plain";
var sizeAdjust = 0;
var scaleAngstromsPerPixel = -1;
switch (this.iToken = this.slen) {
case 6:
scaleAngstromsPerPixel = this.floatParameter (5);
if (scaleAngstromsPerPixel >= 5) scaleAngstromsPerPixel = this.viewer.getZoomSetting () / scaleAngstromsPerPixel / this.viewer.getScalePixelsPerAngstrom (false);
case 5:
if (this.getToken (4).tok != 1073741824) this.error (22);
fontstyle = this.parameterAsString (4);
case 4:
if (this.getToken (3).tok != 1073741824) this.error (22);
fontface = this.parameterAsString (3);
if (!this.isFloatParameter (2)) this.error (34);
fontsize = this.floatParameter (2);
shapeType = this.getShapeType (this.getToken (1).tok);
break;
case 3:
if (!this.isFloatParameter (2)) this.error (34);
if (shapeType == -1) {
shapeType = this.getShapeType (this.getToken (1).tok);
fontsize = this.floatParameter (2);
} else {
if (fontsize >= 1) fontsize += (sizeAdjust = 5);
}break;
case 2:
default:
if (shapeType == 5) {
fontsize = 13;
break;
}this.error (2);
}
if (shapeType == 5) {
if (fontsize < 0 || fontsize >= 1 && (fontsize < 6 || fontsize > 63)) this.integerOutOfRange (6 - sizeAdjust, 63 - sizeAdjust);
this.setShapeProperty (5, "setDefaults", this.viewer.getNoneSelected ());
}if (this.chk) return;
if (J.util.GData.getFontStyleID (fontface) >= 0) {
fontstyle = fontface;
fontface = "SansSerif";
}var font3d = this.viewer.getFont3D (fontface, fontstyle, fontsize);
this.sm.loadShape (shapeType);
this.setShapeProperty (shapeType, "font", font3d);
if (scaleAngstromsPerPixel >= 0) this.setShapeProperty (shapeType, "scalereference", Float.$valueOf (scaleAngstromsPerPixel));
}, $fz.isPrivate = true, $fz), "~N,~N");
$_M(c$, "set", 
($fz = function () {
if (this.slen == 1) {
this.showString (this.viewer.getAllSettings (null));
return;
}var isJmolSet = (this.parameterAsString (0).equals ("set"));
var key = this.optParameterAsString (1);
if (isJmolSet && this.slen == 2 && key.indexOf ("?") >= 0) {
this.showString (this.viewer.getAllSettings (key.substring (0, key.indexOf ("?"))));
return;
}var tok = this.getToken (1).tok;
var newTok = 0;
var sval;
var ival = 2147483647;
var showing = (!this.chk && !this.tQuiet && this.scriptLevel <= this.scriptReportingLevel && !(this.st[0].value).equals ("var"));
switch (tok) {
case 1611272194:
this.axes (2);
return;
case 1610616835:
this.background (2);
return;
case 1679429641:
this.boundbox (2);
return;
case 1611272202:
this.frank (2);
return;
case 1610616855:
this.history (2);
return;
case 1826248715:
this.label (2);
return;
case 1614417948:
this.unitcell (2);
return;
case 536870920:
this.sm.loadShape (8);
this.setShapeProperty (8, "highlight", (this.tokAt (2) == 1048588 ? null : this.atomExpressionAt (2)));
return;
case 1610625028:
case 1611141171:
this.selectionHalo (2);
return;
case 536875070:
this.timeout (2);
return;
}
switch (tok) {
case 1641025539:
var type = J.constant.EnumStructure.getProteinStructureType (this.parameterAsString (2));
if (type === J.constant.EnumStructure.NOT) this.error (22);
var data = this.floatParameterSet (3, 0, 2147483647);
if (data.length % 4 != 0) this.error (22);
this.viewer.setStructureList (data, type);
this.checkLast (this.iToken);
return;
case 545259526:
ival = this.getArgbParam (2);
if (!this.chk) this.setObjectArgb ("axes", ival);
return;
case 1610612737:
this.setBondmode ();
return;
case 536870916:
if (this.chk) return;
var iLevel = (this.tokAt (2) == 1048588 || this.tokAt (2) == 2 && this.intParameter (2) == 0 ? 4 : 5);
J.util.Logger.setLogLevel (iLevel);
this.setIntProperty ("logLevel", iLevel);
if (iLevel == 4) {
this.viewer.setDebugScript (false);
if (showing) this.viewer.showParameter ("debugScript", true, 80);
}this.setDebugging ();
if (showing) this.viewer.showParameter ("logLevel", true, 80);
return;
case 537022465:
this.setEcho ();
return;
case 1610612738:
this.font (5, this.checkLength23 () == 2 ? 0 : this.floatParameter (2));
return;
case 1612189718:
this.setHbond ();
return;
case 1746538509:
case 537006096:
this.setMonitor ();
return;
case 1611141176:
this.setSsbond ();
return;
case 1610612741:
this.setLabel ("toggle");
return;
case 536870930:
this.setUserColors ();
return;
case 553648188:
this.setZslab ();
return;
}
var justShow = true;
switch (tok) {
case 536870914:
if (this.slen > 2) {
var modelDotted = this.stringSetting (2, false);
var modelNumber;
var useModelNumber = false;
if (modelDotted.indexOf (".") < 0) {
modelNumber = J.util.Parser.parseInt (modelDotted);
useModelNumber = true;
} else {
modelNumber = J.script.ScriptEvaluator.getFloatEncodedInt (modelDotted);
}if (this.chk) return;
var modelIndex = this.viewer.getModelNumberIndex (modelNumber, useModelNumber, true);
this.viewer.setBackgroundModelIndex (modelIndex);
return;
}break;
case 1649412112:
if (this.chk) return;
this.viewer.setAtomProperty (this.viewer.getModelUndeletedAtomsBitSet (-1), 1649412112, -1, NaN, null, null, null);
switch (this.tokAt (2)) {
case 1073742109:
this.runScript ("#VDW radii for PROBE;{_H}.vdw = 1.0;{_H and connected(_C) and not connected(within(smiles,\'[a]\'))}.vdw = 1.17;{_C}.vdw = 1.75;{_C and connected(3) and connected(_O)}.vdw = 1.65;{_N}.vdw = 1.55;{_O}.vdw = 1.4;{_P}.vdw = 1.8;{_S}.vdw = 1.8;message VDW radii for H, C, N, O, P, and S set according to Word, et al., J. Mol. Biol. (1999) 285, 1711-1733");
return;
}
newTok = 545259555;
case 545259555:
if (this.slen > 2) {
sval = (this.slen == 3 && J.constant.EnumVdw.getVdwType (this.parameterAsString (2)) == null ? this.stringSetting (2, false) : this.parameterAsString (2));
if (J.constant.EnumVdw.getVdwType (sval) == null) this.error (22);
this.setStringProperty (key, sval);
}break;
case 536870918:
if (this.slen > 2) {
var pt;
var $var = this.parameterExpressionToken (2);
if ($var.tok == 8) pt = $var.value;
 else {
var ijk = $var.asInt ();
if (ijk < 555) pt =  new J.util.P3 ();
 else pt = this.viewer.getSymmetry ().ijkToPoint3f (ijk + 111);
}if (!this.chk) this.viewer.setDefaultLattice (pt);
}break;
case 545259552:
case 545259545:
if (this.slen > 2) {
if ((this.theTok = this.tokAt (2)) == 1073741992 || this.theTok == 1073742116) {
sval = this.parameterAsString (this.checkLast (2));
} else {
sval = this.stringSetting (2, false);
}this.setStringProperty (key, sval);
}break;
case 1632634889:
ival = this.intSetting (2);
if (ival == -2147483648) this.error (22);
if (!this.chk) this.viewer.setFormalCharges (ival);
return;
case 553648148:
ival = this.intSetting (2);
if (!this.chk) {
if (ival != -2147483648) this.commandHistoryLevelMax = ival;
this.setIntProperty (key, ival);
}break;
case 545259564:
if (this.slen > 2) this.setStringProperty (key, this.stringSetting (2, isJmolSet));
break;
case 545259568:
case 545259558:
if (this.slen > 2) this.setUnits (this.stringSetting (2, isJmolSet), tok);
break;
case 545259572:
if (!this.chk) this.viewer.setPicked (-1);
if (this.slen > 2) {
this.setPicking ();
return;
}break;
case 545259574:
if (this.slen > 2) {
this.setPickingStyle ();
return;
}break;
case 1716520973:
break;
case 553648168:
ival = this.intSetting (2);
if (!this.chk && ival != -2147483648) this.setIntProperty (key, this.scriptReportingLevel = ival);
break;
case 536870924:
ival = this.intSetting (2);
if (ival == -2147483648 || ival == 0 || ival == 1) {
justShow = false;
break;
}tok = 553648174;
key = "specularPercent";
this.setIntProperty (key, ival);
break;
case 1650071565:
tok = 553648178;
key = "strandCount";
this.setIntProperty (key, this.intSetting (2));
break;
default:
justShow = false;
}
if (justShow && !showing) return;
var isContextVariable = (!justShow && !isJmolSet && this.getContextVariableAsVariable (key) != null);
if (!justShow && !isContextVariable) {
switch (tok) {
case 1678770178:
newTok = 603979928;
break;
case 1613758470:
newTok = 603979908;
break;
case 1613758476:
newTok = 603979910;
break;
case 1610612739:
newTok = 603979878;
break;
case 1666189314:
newTok = 570425394;
this.setFloatProperty ("solventProbeRadius", this.floatSetting (2));
justShow = true;
break;
case 1610612740:
newTok = 570425390;
break;
case 1613758488:
newTok = 603979948;
break;
case 1766856708:
newTok = 545259545;
break;
case 1611141175:
sval = this.parameterAsString (2).toLowerCase ();
switch ("x;y;z;fps".indexOf (sval + ";")) {
case 0:
newTok = 570425398;
break;
case 2:
newTok = 570425400;
break;
case 4:
newTok = 570425402;
break;
case 6:
newTok = 570425396;
break;
default:
this.errorStr2 (50, "set SPIN ", sval);
}
if (!this.chk) this.viewer.setSpin (sval, Clazz.floatToInt (this.floatParameter (this.checkLast (3))));
justShow = true;
break;
}
}if (newTok != 0) {
key = J.script.T.nameOf (tok = newTok);
} else if (!justShow && !isContextVariable) {
if (key.length == 0 || key.charAt (0) == '_') this.error (56);
var lckey = key.toLowerCase ();
if (lckey.indexOf ("label") == 0 && J.util.Parser.isOneOf (key.substring (5).toLowerCase (), "front;group;atom;offset;offsetexact;pointer;alignment;toggle;scalereference")) {
if (this.setLabel (key.substring (5))) return;
}if (lckey.endsWith ("callback")) tok = 536870912;
}if (isJmolSet && !J.script.T.tokAttr (tok, 536870912)) {
this.iToken = 1;
if (!this.isStateScript) this.errorStr2 (50, "SET", key);
this.warning (51, "SET", key);
}if (!justShow && isJmolSet) {
switch (this.slen) {
case 2:
this.setBooleanProperty (key, true);
justShow = true;
break;
case 3:
if (ival != 2147483647) {
this.setIntProperty (key, ival);
justShow = true;
}break;
}
}if (!justShow && !isJmolSet && this.tokAt (2) == 1048587) {
if (!this.chk) this.viewer.removeUserVariable (key.toLowerCase ());
justShow = true;
}if (!justShow) {
var tok2 = (this.tokAt (1) == 1048577 ? 0 : this.tokAt (2));
var setType = this.st[0].intValue;
var pt = (tok2 == 269484436 ? 3 : setType == 61 && !key.equals ("return") && tok2 != 269484436 ? 0 : 2);
this.setVariable (pt, 0, key, setType);
if (!isJmolSet) return;
}if (showing) this.viewer.showParameter (key, true, 80);
}, $fz.isPrivate = true, $fz));
$_M(c$, "setZslab", 
($fz = function () {
var pt = null;
if (this.isFloatParameter (2)) {
this.checkLength (3);
this.setIntProperty ("zSlab", Clazz.floatToInt (this.floatParameter (2)));
} else {
if (!this.isCenterParameter (2)) this.error (22);
pt = this.centerParameter (2);
this.checkLength (this.iToken + 1);
}if (!this.chk) this.viewer.setZslabPoint (pt);
}, $fz.isPrivate = true, $fz));
$_M(c$, "setBondmode", 
($fz = function () {
var bondmodeOr = false;
switch (this.getToken (this.checkLast (2)).tok) {
case 269484128:
break;
case 269484112:
bondmodeOr = true;
break;
default:
this.error (22);
}
this.setBooleanProperty ("bondModeOr", bondmodeOr);
}, $fz.isPrivate = true, $fz));
$_M(c$, "setEcho", 
($fz = function () {
var propertyName = null;
var propertyValue = null;
var id = null;
var echoShapeActive = true;
var pt = 2;
switch (this.getToken (2).tok) {
case 1048588:
id = propertyName = "allOff";
this.checkLength (++pt);
break;
case 1048587:
echoShapeActive = false;
case 1048579:
id = this.parameterAsString (2);
this.checkLength (++pt);
break;
case 1073741996:
case 12289:
case 1073742128:
case 1074790748:
case 1073742019:
case 1073741871:
case 1073741824:
case 4:
case 1074790550:
if (this.theTok == 1074790550) pt++;
id = this.parameterAsString (pt++);
break;
}
if (!this.chk) {
this.viewer.setEchoStateActive (echoShapeActive);
this.sm.loadShape (30);
if (id != null) this.setShapeProperty (30, propertyName == null ? "target" : propertyName, id);
}if (pt < this.slen) {
switch (this.getToken (pt++).tok) {
case 1073741832:
propertyName = "align";
switch (this.getToken (pt).tok) {
case 1073741996:
case 1073742128:
case 12289:
propertyValue = this.parameterAsString (pt++);
break;
default:
this.error (22);
}
break;
case 12289:
case 1073741996:
case 1073742128:
propertyName = "align";
propertyValue = this.parameterAsString (pt - 1);
break;
case 554176526:
propertyName = "%zpos";
propertyValue = Integer.$valueOf (Clazz.floatToInt (this.floatParameter (pt++)));
break;
case 1610625028:
case 3145768:
case 1048589:
propertyName = "hidden";
propertyValue = Boolean.FALSE;
break;
case 12294:
case 3145770:
propertyName = "hidden";
propertyValue = Boolean.TRUE;
break;
case 1095766028:
var modelIndex = (this.chk ? 0 : this.modelNumberParameter (pt++));
if (modelIndex >= this.viewer.getModelCount ()) this.error (22);
propertyName = "model";
propertyValue = Integer.$valueOf (modelIndex);
break;
case 269484096:
case 1073742195:
propertyName = "xypos";
propertyValue = this.xypParameter (--pt);
if (propertyValue == null) pt--;
 else pt = this.iToken + 1;
break;
case 2:
pt--;
var posx = this.intParameter (pt++);
var namex = "xpos";
if (this.tokAt (pt) == 269484210) {
namex = "%xpos";
pt++;
}propertyName = "ypos";
propertyValue = Integer.$valueOf (this.intParameter (pt++));
if (this.tokAt (pt) == 269484210) {
propertyName = "%ypos";
pt++;
}this.checkLength (pt);
this.setShapeProperty (30, namex, Integer.$valueOf (posx));
break;
case 1048588:
propertyName = "off";
break;
case 1073742138:
propertyName = "scale";
propertyValue = Float.$valueOf (this.floatParameter (pt++));
break;
case 135271429:
propertyName = "script";
propertyValue = this.parameterAsString (pt++);
break;
case 4:
case 1073741979:
var isImage = (this.theTok == 1073741979);
if (isImage) pt++;
this.checkLength (pt);
if (id == null && isImage) {
var data =  new Array (1);
this.getShapePropertyData (30, "currentTarget", data);
id = data[0];
}this.echo (pt - 1, id, isImage);
return;
default:
if (this.isCenterParameter (pt - 1)) {
propertyName = "xyz";
propertyValue = this.centerParameter (pt - 1);
pt = this.iToken + 1;
break;
}this.error (22);
}
}this.checkLength (pt);
if (!this.chk && propertyName != null) this.setShapeProperty (30, propertyName, propertyValue);
}, $fz.isPrivate = true, $fz));
$_M(c$, "intSetting", 
($fz = function (pt) {
if (pt == this.slen) return -2147483648;
return this.parameterExpressionToken (pt).asInt ();
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "floatSetting", 
($fz = function (pt) {
if (pt == this.slen) return NaN;
return J.script.SV.fValue (this.parameterExpressionToken (pt));
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "stringSetting", 
($fz = function (pt, isJmolSet) {
if (isJmolSet && this.slen == pt + 1) return this.parameterAsString (pt);
return this.parameterExpressionToken (pt).asString ();
}, $fz.isPrivate = true, $fz), "~N,~B");
$_M(c$, "setLabel", 
($fz = function (str) {
this.sm.loadShape (5);
var propertyValue = null;
this.setShapeProperty (5, "setDefaults", this.viewer.getNoneSelected ());
while (true) {
if (str.equals ("scalereference")) {
var scaleAngstromsPerPixel = this.floatParameter (2);
if (scaleAngstromsPerPixel >= 5) scaleAngstromsPerPixel = this.viewer.getZoomSetting () / scaleAngstromsPerPixel / this.viewer.getScalePixelsPerAngstrom (false);
propertyValue = Float.$valueOf (scaleAngstromsPerPixel);
break;
}if (str.equals ("offset") || str.equals ("offsetexact")) {
var xOffset = this.intParameterRange (2, -127, 127);
var yOffset = this.intParameterRange (3, -127, 127);
propertyValue = Integer.$valueOf (J.shape.Object2d.getOffset (xOffset, yOffset));
break;
}if (str.equals ("alignment")) {
switch (this.getToken (2).tok) {
case 1073741996:
case 1073742128:
case 12289:
str = "align";
propertyValue = this.theToken.value;
break;
default:
this.error (22);
}
break;
}if (str.equals ("pointer")) {
var flags = 0;
switch (this.getToken (2).tok) {
case 1048588:
case 1048587:
break;
case 1610616835:
flags |= 2;
case 1048589:
flags |= 1;
break;
default:
this.error (22);
}
propertyValue = Integer.$valueOf (flags);
break;
}if (str.equals ("toggle")) {
this.iToken = 1;
var bs = (this.slen == 2 ? null : this.atomExpressionAt (2));
this.checkLast (this.iToken);
if (!this.chk) this.viewer.togglePickingLabel (bs);
return true;
}this.iToken = 1;
var TF = (this.slen == 2 || this.getToken (2).tok == 1048589);
if (str.equals ("front") || str.equals ("group")) {
if (!TF && this.tokAt (2) != 1048588) this.error (22);
if (!TF) str = "front";
propertyValue = (TF ? Boolean.TRUE : Boolean.FALSE);
break;
}if (str.equals ("atom")) {
if (!TF && this.tokAt (2) != 1048588) this.error (22);
str = "front";
propertyValue = (TF ? Boolean.FALSE : Boolean.TRUE);
break;
}return false;
}
var bs = (this.iToken + 1 < this.slen ? this.atomExpressionAt (++this.iToken) : null);
this.checkLast (this.iToken);
if (this.chk) return true;
if (bs == null) this.setShapeProperty (5, str, propertyValue);
 else this.setShapePropertyBs (5, str, propertyValue, bs);
return true;
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "setMonitor", 
($fz = function () {
var tok = this.tokAt (this.checkLast (2));
switch (tok) {
case 1048589:
case 1048588:
this.setBooleanProperty ("measurementlabels", tok == 1048589);
return;
case 1073741926:
case 2:
case 3:
this.setShapeSizeBs (6, this.getSetAxesTypeMad (2), null);
return;
}
this.setUnits (this.parameterAsString (2), 545259568);
}, $fz.isPrivate = true, $fz));
$_M(c$, "setUnits", 
($fz = function (units, tok) {
if (tok == 545259568 && J.util.Parser.isOneOf (units.toLowerCase (), "angstroms;au;bohr;nanometers;nm;picometers;pm;vanderwaals;vdw")) {
if (!this.chk) this.viewer.setUnits (units, true);
} else if (tok == 545259558 && J.util.Parser.isOneOf (units.toLowerCase (), "kcal;kj")) {
if (!this.chk) this.viewer.setUnits (units, false);
} else {
this.errorStr2 (50, "set " + J.script.T.nameOf (tok), units);
}return true;
}, $fz.isPrivate = true, $fz), "~S,~N");
$_M(c$, "setSsbond", 
($fz = function () {
var ssbondsBackbone = false;
switch (this.tokAt (this.checkLast (2))) {
case 1115297793:
ssbondsBackbone = true;
break;
case 3145754:
break;
default:
this.error (22);
}
this.setBooleanProperty ("ssbondsBackbone", ssbondsBackbone);
}, $fz.isPrivate = true, $fz));
$_M(c$, "setHbond", 
($fz = function () {
var bool = false;
switch (this.tokAt (this.checkLast (2))) {
case 1115297793:
bool = true;
case 3145754:
this.setBooleanProperty ("hbondsBackbone", bool);
break;
case 1073742150:
bool = true;
case 1073741926:
this.setBooleanProperty ("hbondsSolid", bool);
break;
default:
this.error (22);
}
}, $fz.isPrivate = true, $fz));
$_M(c$, "setPicking", 
($fz = function () {
if (this.slen == 2) {
this.setStringProperty ("picking", "identify");
return;
}if (this.slen > 4 || this.tokAt (2) == 4) {
this.setStringProperty ("picking", this.stringSetting (2, false));
return;
}var i = 2;
var type = "SELECT";
switch (this.getToken (2).tok) {
case 135280132:
case 1746538509:
case 1611141175:
if (this.checkLength34 () == 4) {
type = this.parameterAsString (2).toUpperCase ();
if (type.equals ("SPIN")) this.setIntProperty ("pickingSpinRate", this.intParameter (3));
 else i = 3;
}break;
case 12291:
break;
default:
this.checkLength (3);
}
var str = this.parameterAsString (i);
switch (this.getToken (i).tok) {
case 1048589:
case 1073742056:
str = "identify";
break;
case 1048588:
case 1048587:
str = "off";
break;
case 135280132:
str = "atom";
break;
case 1826248715:
str = "label";
break;
case 1678770178:
str = "bond";
break;
case 12291:
this.checkLength (4);
if (this.tokAt (3) != 1678770178) this.error (22);
str = "deleteBond";
break;
}
var mode = ((mode = str.indexOf ("_")) >= 0 ? mode : str.length);
mode = J.viewer.ActionManager.getPickingMode (str.substring (0, mode));
if (mode < 0) this.errorStr2 (50, "SET PICKING " + type, str);
this.setStringProperty ("picking", str);
}, $fz.isPrivate = true, $fz));
$_M(c$, "setPickingStyle", 
($fz = function () {
if (this.slen > 4 || this.tokAt (2) == 4) {
this.setStringProperty ("pickingStyle", this.stringSetting (2, false));
return;
}var i = 2;
var isMeasure = false;
var type = "SELECT";
switch (this.getToken (2).tok) {
case 1746538509:
isMeasure = true;
type = "MEASURE";
case 135280132:
if (this.checkLength34 () == 4) i = 3;
break;
default:
this.checkLength (3);
}
var str = this.parameterAsString (i);
switch (this.getToken (i).tok) {
case 1048587:
case 1048588:
str = (isMeasure ? "measureoff" : "toggle");
break;
case 1048589:
if (isMeasure) str = "measure";
break;
}
if (J.viewer.ActionManager.getPickingStyleIndex (str) < 0) this.errorStr2 (50, "SET PICKINGSTYLE " + type, str);
this.setStringProperty ("pickingStyle", str);
}, $fz.isPrivate = true, $fz));
$_M(c$, "timeout", 
($fz = function (index) {
var name = null;
var script = null;
var mSec = 0;
if (this.slen == index) {
this.showString (this.viewer.showTimeout (null));
return;
}for (var i = index; i < this.slen; i++) switch (this.getToken (i).tok) {
case 1074790550:
name = this.parameterAsString (++i);
if (this.slen == 3) {
if (!this.chk) this.viewer.triggerTimeout (name);
return;
}break;
case 1048588:
break;
case 2:
mSec = this.intParameter (i);
break;
case 3:
mSec = Math.round (this.floatParameter (i) * 1000);
break;
default:
if (name == null) name = this.parameterAsString (i);
 else if (script == null) script = this.parameterAsString (i);
 else this.error (22);
break;
}

if (!this.chk) this.viewer.setTimeout (name, mSec, script);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "setUserColors", 
($fz = function () {
var v =  new J.util.JmolList ();
for (var i = 2; i < this.slen; i++) {
var argb = this.getArgbParam (i);
v.addLast (Integer.$valueOf (argb));
i = this.iToken;
}
if (this.chk) return;
var n = v.size ();
var scale =  Clazz.newIntArray (n, 0);
for (var i = n; --i >= 0; ) scale[i] = v.get (i).intValue ();

this.viewer.setUserScale (scale);
}, $fz.isPrivate = true, $fz));
$_M(c$, "setVariable", 
($fz = function (pt, ptMax, key, setType) {
var bs = null;
var propertyName = "";
var tokProperty = 0;
var isArrayItem = (setType == 91);
var settingProperty = false;
var isExpression = false;
var settingData = (key.startsWith ("property_"));
var t = (settingData ? null : this.getContextVariableAsVariable (key));
var isUserVariable = (t != null);
if (pt > 0 && this.tokAt (pt - 1) == 1048577) {
bs = this.atomExpressionAt (pt - 1);
pt = this.iToken + 1;
isExpression = true;
}if (this.tokAt (pt) == 1048584) {
settingProperty = true;
var token = this.getBitsetPropertySelector (++pt, true);
if (token == null) this.error (22);
if (this.tokAt (++pt) != 269484436) this.error (22);
pt++;
tokProperty = token.intValue;
propertyName = token.value;
}if (isExpression && !settingProperty) this.error (22);
var v = this.parameterExpression (pt, ptMax, key, true, true, -1, isArrayItem, null, null);
var nv = v.size ();
if (nv == 0 || !isArrayItem && nv > 1 || isArrayItem && (nv < 3 || nv % 2 != 1)) this.error (22);
if (this.chk) return;
var tv = v.get (isArrayItem ? v.size () - 1 : 0);
var needVariable = (!isUserVariable && !isExpression && !settingData && (isArrayItem || settingProperty || !(Clazz.instanceOf (tv.value, String) || tv.tok == 2 || Clazz.instanceOf (tv.value, Integer) || Clazz.instanceOf (tv.value, Float) || Clazz.instanceOf (tv.value, Boolean))));
if (needVariable) {
if (key.startsWith ("_")) this.errorStr (22, key);
t = this.viewer.getOrSetNewVariable (key, true);
isUserVariable = true;
}if (isArrayItem) {
var tnew = (J.script.SV.newVariable (4, "")).setv (tv, false);
var nParam = Clazz.doubleToInt (v.size () / 2);
for (var i = 0; i < nParam; i++) {
var isLast = (i + 1 == nParam);
var vv = v.get (i * 2);
if (t.tok == 10) {
t.tok = 6;
t.value =  new java.util.Hashtable ();
}if (t.tok == 6) {
var hkey = vv.asString ();
var tmap = t.value;
if (isLast) {
tmap.put (hkey, tnew);
break;
}t = tmap.get (hkey);
} else {
var ipt = vv.asInt ();
if (t.tok == 7) t = J.script.SV.selectItemVar (t);
switch (t.tok) {
case 7:
var list = t.getList ();
if (ipt > list.size () || isLast) break;
if (ipt <= 0) ipt = list.size () + ipt;
if (--ipt < 0) ipt = 0;
t = list.get (ipt);
continue;
case 11:
case 12:
var dim = (t.tok == 11 ? 3 : 4);
if (nParam == 1 && Math.abs (ipt) >= 1 && Math.abs (ipt) <= dim && tnew.tok == 7 && tnew.getList ().size () == dim) break;
if (nParam == 2) {
var ipt2 = v.get (2).asInt ();
if (ipt2 >= 1 && ipt2 <= dim && (tnew.tok == 2 || tnew.tok == 3)) {
i++;
ipt = ipt * 10 + ipt2;
break;
}}t.toArray ();
--i;
continue;
}
t.setSelectedValue (ipt, tnew);
break;
}}
return;
}if (settingProperty) {
if (!isExpression) {
bs = J.script.SV.getBitSet (t, true);
if (bs == null) this.error (22);
}if (propertyName.startsWith ("property_")) {
this.viewer.setData (propertyName, [propertyName, (tv.tok == 7 ? J.script.SV.flistValue (tv, (tv.value).size () == bs.cardinality () ? bs.cardinality () : this.viewer.getAtomCount ()) : tv.asString ()), J.util.BSUtil.copy (bs), Integer.$valueOf (tv.tok == 7 ? 1 : 0)], this.viewer.getAtomCount (), 0, 0, tv.tok == 7 ? 2147483647 : -2147483648, 0);
return;
}this.setBitsetProperty (bs, tokProperty, tv.asInt (), tv.asFloat (), tv);
return;
}if (isUserVariable) {
t.setv (tv, false);
return;
}var vv = J.script.SV.oValue (tv);
if (key.startsWith ("property_")) {
if (tv.tok == 7) vv = tv.asString ();
this.viewer.setData (key, [key, "" + vv, J.util.BSUtil.copy (this.viewer.getSelectionSet (false)), Integer.$valueOf (0)], this.viewer.getAtomCount (), 0, 0, -2147483648, 0);
return;
}if (Clazz.instanceOf (vv, Boolean)) {
this.setBooleanProperty (key, (vv).booleanValue ());
} else if (Clazz.instanceOf (vv, Integer)) {
this.setIntProperty (key, (vv).intValue ());
} else if (Clazz.instanceOf (vv, Float)) {
this.setFloatProperty (key, (vv).floatValue ());
} else if (Clazz.instanceOf (vv, String)) {
this.setStringProperty (key, vv);
} else if (Clazz.instanceOf (vv, J.modelset.Bond.BondSet)) {
this.setStringProperty (key, J.util.Escape.eBond (vv));
} else if (Clazz.instanceOf (vv, J.util.BS) || Clazz.instanceOf (vv, J.util.P3) || Clazz.instanceOf (vv, J.util.P4)) {
this.setStringProperty (key, J.util.Escape.e (vv));
} else {
J.util.Logger.error ("ERROR -- return from propertyExpression was " + vv);
}}, $fz.isPrivate = true, $fz), "~N,~N,~S,~N");
$_M(c$, "axes", 
($fz = function (index) {
var tickInfo = this.checkTicks (index, true, true, false);
index = this.iToken + 1;
var tok = this.tokAt (index);
var type = this.optParameterAsString (index).toLowerCase ();
if (this.slen == index + 1 && J.util.Parser.isOneOf (type, "window;unitcell;molecular")) {
this.setBooleanProperty ("axes" + type, true);
return;
}switch (tok) {
case 12289:
var center = this.centerParameter (index + 1);
this.setShapeProperty (31, "origin", center);
this.checkLast (this.iToken);
return;
case 1073742138:
this.setFloatProperty ("axesScale", this.floatParameter (this.checkLast (++index)));
return;
case 1826248715:
switch (tok = this.tokAt (index + 1)) {
case 1048588:
case 1048589:
this.checkLength (index + 2);
this.setShapeProperty (31, "labels" + (tok == 1048589 ? "On" : "Off"), null);
return;
}
var sOrigin = null;
switch (this.slen - index) {
case 7:
this.setShapeProperty (31, "labels", [this.parameterAsString (++index), this.parameterAsString (++index), this.parameterAsString (++index), this.parameterAsString (++index), this.parameterAsString (++index), this.parameterAsString (++index)]);
break;
case 5:
sOrigin = this.parameterAsString (index + 4);
case 4:
this.setShapeProperty (31, "labels", [this.parameterAsString (++index), this.parameterAsString (++index), this.parameterAsString (++index), sOrigin]);
break;
default:
this.error (2);
}
return;
}
if (type.equals ("position")) {
var xyp;
if (this.tokAt (++index) == 1048588) {
xyp =  new J.util.P3 ();
} else {
xyp = this.xypParameter (index);
if (xyp == null) this.error (22);
index = this.iToken;
}this.setShapeProperty (31, "position", xyp);
return;
}var mad = this.getSetAxesTypeMad (index);
if (this.chk) return;
this.setObjectMad (31, "axes", mad);
if (tickInfo != null) this.setShapeProperty (31, "tickInfo", tickInfo);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "boundbox", 
($fz = function (index) {
var tickInfo = this.checkTicks (index, false, true, false);
index = this.iToken + 1;
var scale = 1;
if (this.tokAt (index) == 1073742138) {
scale = this.floatParameter (++index);
if (!this.chk && scale == 0) this.error (22);
index++;
if (index == this.slen) {
if (!this.chk) this.viewer.setBoundBox (null, null, true, scale);
return;
}}var byCorner = (this.tokAt (index) == 1073741902);
if (byCorner) index++;
if (this.isCenterParameter (index)) {
this.expressionResult = null;
var index0 = index;
var pt1 = this.centerParameter (index);
index = this.iToken + 1;
if (byCorner || this.isCenterParameter (index)) {
var pt2 = (byCorner ? this.centerParameter (index) : this.getPoint3f (index, true));
index = this.iToken + 1;
if (!this.chk) this.viewer.setBoundBox (pt1, pt2, byCorner, scale);
} else if (this.expressionResult != null && Clazz.instanceOf (this.expressionResult, J.util.BS)) {
if (!this.chk) this.viewer.calcBoundBoxDimensions (this.expressionResult, scale);
} else if (this.expressionResult == null && this.tokAt (index0) == 1048583) {
if (this.chk) return;
var bbox = this.getObjectBoundingBox (this.objectNameParameter (++index0));
if (bbox == null) this.error (22);
this.viewer.setBoundBox (bbox[0], bbox[1], true, scale);
index = this.iToken + 1;
} else {
this.error (22);
}if (index == this.slen) return;
}var mad = this.getSetAxesTypeMad (index);
if (this.chk) return;
if (tickInfo != null) this.setShapeProperty (32, "tickInfo", tickInfo);
this.setObjectMad (32, "boundbox", mad);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "checkTicks", 
($fz = function (index, allowUnitCell, allowScale, allowFirst) {
this.iToken = index - 1;
if (this.tokAt (index) != 1073742164) return null;
var tickInfo;
var str = " ";
switch (this.tokAt (index + 1)) {
case 1112541205:
case 1112541206:
case 1112541207:
str = this.parameterAsString (++index).toLowerCase ();
break;
case 1073741824:
this.error (22);
}
if (this.tokAt (++index) == 1048587) {
tickInfo =  new J.modelset.TickInfo (null);
tickInfo.type = str;
this.iToken = index;
return tickInfo;
}tickInfo =  new J.modelset.TickInfo (this.getPointOrPlane (index, false, true, false, false, 3, 3));
if (this.coordinatesAreFractional || this.tokAt (this.iToken + 1) == 1614417948) {
tickInfo.scale = J.util.P3.new3 (NaN, NaN, NaN);
allowScale = false;
}if (this.tokAt (this.iToken + 1) == 1614417948) this.iToken++;
tickInfo.type = str;
if (this.tokAt (this.iToken + 1) == 1288701960) tickInfo.tickLabelFormats = this.stringParameterSet (this.iToken + 2);
if (!allowScale) return tickInfo;
if (this.tokAt (this.iToken + 1) == 1073742138) {
if (this.isFloatParameter (this.iToken + 2)) {
var f = this.floatParameter (this.iToken + 2);
tickInfo.scale = J.util.P3.new3 (f, f, f);
} else {
tickInfo.scale = this.getPoint3f (this.iToken + 2, true);
}}if (allowFirst) if (this.tokAt (this.iToken + 1) == 1073741942) tickInfo.first = this.floatParameter (this.iToken + 2);
return tickInfo;
}, $fz.isPrivate = true, $fz), "~N,~B,~B,~B");
$_M(c$, "unitcell", 
($fz = function (index) {
var icell = 2147483647;
var mad = 2147483647;
var pt = null;
var tickInfo = this.checkTicks (index, true, false, false);
index = this.iToken;
var id = null;
var points = null;
switch (this.tokAt (index + 1)) {
case 4:
id = this.objectNameParameter (++index);
break;
case 1048583:
index++;
id = this.objectNameParameter (++index);
break;
default:
if (this.isArrayParameter (index + 1)) {
points = this.getPointArray (++index, 4);
index = this.iToken;
} else if (this.slen == index + 2) {
if (this.getToken (index + 1).tok == 2 && this.intParameter (index + 1) >= 111) icell = this.intParameter (++index);
} else if (this.slen > index + 1) {
pt = this.getPointOrPlane (++index, false, true, false, true, 3, 3);
index = this.iToken;
}}
mad = this.getSetAxesTypeMad (++index);
this.checkLast (this.iToken);
if (this.chk) return;
if (icell != 2147483647) this.viewer.setCurrentUnitCellOffset (icell);
 else if (id != null) this.viewer.setCurrentCage (id);
 else if (points != null) this.viewer.setCurrentCagePts (points);
this.setObjectMad (33, "unitCell", mad);
if (pt != null) this.viewer.setCurrentUnitCellOffsetPt (pt);
if (tickInfo != null) this.setShapeProperty (33, "tickInfo", tickInfo);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "frank", 
($fz = function (index) {
this.setBooleanProperty ("frank", this.booleanParameter (index));
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "selectionHalo", 
($fz = function (pt) {
var showHalo = false;
switch (pt == this.slen ? 1048589 : this.getToken (pt).tok) {
case 1048589:
case 1114638350:
showHalo = true;
case 1048588:
case 1048587:
case 1073742056:
this.setBooleanProperty ("selectionHalos", showHalo);
break;
default:
this.error (22);
}
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "save", 
($fz = function () {
if (this.slen > 1) {
var saveName = this.optParameterAsString (2);
switch (this.tokAt (1)) {
case 1073742132:
if (!this.chk) this.viewer.saveOrientation (saveName);
return;
case 1073742077:
if (!this.chk) this.viewer.saveOrientation (saveName);
return;
case 1678770178:
if (!this.chk) this.viewer.saveBonds (saveName);
return;
case 1073742158:
if (!this.chk) this.viewer.saveState (saveName);
return;
case 1641025539:
if (!this.chk) this.viewer.saveStructure (saveName);
return;
case 1048582:
if (!this.chk) this.viewer.saveCoordinates (saveName, this.viewer.getSelectionSet (false));
return;
case 1073742140:
if (!this.chk) this.viewer.saveSelection (saveName);
return;
}
}this.errorStr2 (53, "SAVE", "bonds? coordinates? orientation? selection? state? structure?");
}, $fz.isPrivate = true, $fz));
$_M(c$, "restore", 
($fz = function () {
if (this.slen > 1) {
var saveName = this.optParameterAsString (2);
if (this.getToken (1).tok != 1073742077) this.checkLength23 ();
var floatSecondsTotal;
switch (this.getToken (1).tok) {
case 1073742132:
floatSecondsTotal = (this.slen > 3 ? this.floatParameter (3) : 0);
if (floatSecondsTotal < 0) this.error (22);
if (!this.chk) {
this.viewer.restoreRotation (saveName, floatSecondsTotal);
if (this.isJS && floatSecondsTotal > 0 && this.viewer.global.waitForMoveTo) throw  new J.script.ScriptInterruption (this, "restoreRotation", 1);
}return;
case 1073742077:
floatSecondsTotal = (this.slen > 3 ? this.floatParameter (3) : 0);
if (floatSecondsTotal < 0) this.error (22);
if (!this.chk) {
this.viewer.restoreOrientation (saveName, floatSecondsTotal);
if (this.isJS && floatSecondsTotal > 0 && this.viewer.global.waitForMoveTo) throw  new J.script.ScriptInterruption (this, "restoreOrientation", 1);
}return;
case 1678770178:
if (!this.chk) this.viewer.restoreBonds (saveName);
return;
case 1048582:
if (this.chk) return;
var script = this.viewer.getSavedCoordinates (saveName);
if (script == null) this.error (22);
this.runScript (script);
this.viewer.checkCoordinatesChanged ();
return;
case 1073742158:
if (this.chk) return;
var state = this.viewer.getSavedState (saveName);
if (state == null) this.error (22);
this.runScript (state);
return;
case 1641025539:
if (this.chk) return;
var shape = this.viewer.getSavedStructure (saveName);
if (shape == null) this.error (22);
this.runScript (shape);
return;
case 1073742140:
if (!this.chk) this.viewer.restoreSelection (saveName);
return;
}
}this.errorStr2 (53, "RESTORE", "bonds? coords? orientation? selection? state? structure?");
}, $fz.isPrivate = true, $fz));
$_M(c$, "write", 
function (args) {
var pt = 0;
var pt0 = 0;
var isCommand;
var isShow;
if (args == null) {
args = this.st;
pt = pt0 = 1;
isCommand = true;
isShow = (this.viewer.isApplet () && !this.viewer.isSignedApplet () || !this.viewer.isRestricted (J.viewer.Viewer.ACCESS.ALL) || this.viewer.getPathForAllFiles ().length > 0);
} else {
isCommand = false;
isShow = true;
}var argCount = (isCommand ? this.slen : args.length);
var len = 0;
var nVibes = 0;
var width = -1;
var height = -1;
var quality = -2147483648;
var driverList = this.viewer.getExportDriverList ();
var sceneType = "PNGJ";
var data = null;
var type2 = "";
var fileName = null;
var localPath = null;
var remotePath = null;
var val = null;
var msg = null;
var fullPath =  new Array (1);
var isCoord = false;
var isExport = false;
var isImage = false;
var bsFrames = null;
var scripts = null;
var type = "SPT";
var tok = (isCommand && args.length == 1 ? 1073741884 : J.script.ScriptEvaluator.tokAtArray (pt, args));
switch (tok) {
case 0:
break;
case 135271429:
if (this.isArrayParameter (pt + 1)) {
scripts = this.stringParameterSet (++pt);
localPath = ".";
remotePath = ".";
pt0 = pt = this.iToken + 1;
tok = this.tokAt (pt);
}break;
default:
type = J.script.SV.sValue (this.tokenAt (pt, args)).toUpperCase ();
}
switch (tok) {
case 0:
break;
case 135270417:
case 1052714:
case 1716520973:
msg = this.plot (args);
if (!isCommand) return msg;
break;
case 1073741983:
type = "INLINE";
data = J.script.SV.sValue (this.tokenAt (++pt, args));
pt++;
break;
case 1073742102:
type = "PGRP";
pt++;
type2 = J.script.SV.sValue (this.tokenAt (pt, args)).toLowerCase ();
if (type2.equals ("draw")) pt++;
break;
case 1048582:
pt++;
isCoord = true;
break;
case 1073742158:
case 135271429:
val = J.script.SV.sValue (this.tokenAt (++pt, args)).toLowerCase ();
while (val.equals ("localpath") || val.equals ("remotepath")) {
if (val.equals ("localpath")) localPath = J.script.SV.sValue (this.tokenAt (++pt, args));
 else remotePath = J.script.SV.sValue (this.tokenAt (++pt, args));
val = J.script.SV.sValue (this.tokenAt (++pt, args)).toLowerCase ();
}
type = "SPT";
break;
case 1229984263:
case 135368713:
case 1610616855:
case 135180:
case 1073742015:
case 1073742018:
case 1183762:
case 135188:
pt++;
break;
case 1073741992:
type = "ZIPALL";
pt++;
break;
case 36868:
type = "VAR";
pt += 2;
break;
case 4115:
case 1073741824:
case 1073741979:
case 1073742139:
case 4:
case 4166:
switch (tok) {
case 1073741979:
pt++;
break;
case 4166:
nVibes = this.intParameterRange (++pt, 1, 10);
if (!this.chk) {
this.viewer.setVibrationOff ();
if (!this.isJS) this.viewer.delayScript (this, 100);
}pt++;
break;
case 4115:
var bsAtoms;
if (pt + 1 < argCount && args[++pt].tok == 1048577 || args[pt].tok == 10) {
bsAtoms = this.atomExpression (args, pt, 0, true, false, true, true);
pt = this.iToken + 1;
} else {
bsAtoms = this.viewer.getModelUndeletedAtomsBitSet (-1);
}if (!this.chk) bsFrames = this.viewer.getModelBitSet (bsAtoms, true);
break;
case 1073742139:
val = J.script.SV.sValue (this.tokenAt (++pt, args)).toUpperCase ();
if (J.util.Parser.isOneOf (val, "PNG;PNGJ")) {
sceneType = val;
pt++;
}break;
default:
case 4:
var t = J.script.T.getTokenFromName (J.script.SV.sValue (args[pt]).toLowerCase ());
if (t != null) {
tok = t.tok;
type = J.script.SV.sValue (t).toUpperCase ();
}if (J.util.Parser.isOneOf (type, driverList.toUpperCase ())) {
pt++;
type = type.substring (0, 1).toUpperCase () + type.substring (1).toLowerCase ();
isExport = true;
if (isCommand) fileName = "Jmol." + type;
} else if (type.equals ("ZIP")) {
pt++;
} else if (type.equals ("ZIPALL")) {
pt++;
} else {
type = "(image)";
}break;
}
if (J.script.ScriptEvaluator.tokAtArray (pt, args) == 2) {
width = J.script.SV.iValue (this.tokenAt (pt++, args));
height = J.script.SV.iValue (this.tokenAt (pt++, args));
}break;
}
if (msg == null) {
val = J.script.SV.sValue (this.tokenAt (pt, args));
if (val.equalsIgnoreCase ("clipboard")) {
if (this.chk) return "";
} else if (J.util.Parser.isOneOf (val.toLowerCase (), "png;pngj;pngt;jpg;jpeg;jpg64;jpeg64")) {
if (J.script.ScriptEvaluator.tokAtArray (pt + 1, args) == 2 && J.script.ScriptEvaluator.tokAtArray (pt + 2, args) == 2) {
width = J.script.SV.iValue (this.tokenAt (++pt, args));
height = J.script.SV.iValue (this.tokenAt (++pt, args));
}if (J.script.ScriptEvaluator.tokAtArray (pt + 1, args) == 2) quality = J.script.SV.iValue (this.tokenAt (++pt, args));
} else if (J.util.Parser.isOneOf (val.toLowerCase (), "xyz;xyzrn;xyzvib;mol;sdf;v2000;v3000;cd;pdb;pqr;cml")) {
type = val.toUpperCase ();
if (pt + 1 == argCount) pt++;
}if (type.equals ("(image)") && J.util.Parser.isOneOf (val.toUpperCase (), "GIF;JPG;JPG64;JPEG;JPEG64;PNG;PNGJ;PNGT;PPM")) {
type = val.toUpperCase ();
pt++;
}if (pt + 2 == argCount) {
data = J.script.SV.sValue (this.tokenAt (++pt, args));
if (data.length > 0 && data.charAt (0) != '.') type = val.toUpperCase ();
}switch (J.script.ScriptEvaluator.tokAtArray (pt, args)) {
case 0:
isShow = true;
break;
case 1073741884:
break;
case 1073741824:
case 4:
fileName = J.script.SV.sValue (this.tokenAt (pt, args));
if (pt == argCount - 3 && J.script.ScriptEvaluator.tokAtArray (pt + 1, args) == 1048584) {
fileName += "." + J.script.SV.sValue (this.tokenAt (pt + 2, args));
}if (type !== "VAR" && pt == pt0) type = "IMAGE";
 else if (fileName.length > 0 && fileName.charAt (0) == '.' && (pt == pt0 + 1 || pt == pt0 + 2)) {
fileName = J.script.SV.sValue (this.tokenAt (pt - 1, args)) + fileName;
if (type !== "VAR" && pt == pt0 + 1) type = "IMAGE";
}if (fileName.equalsIgnoreCase ("clipboard") || !this.viewer.isRestricted (J.viewer.Viewer.ACCESS.ALL)) fileName = null;
break;
default:
this.error (22);
}
if (type.equals ("IMAGE") || type.equals ("FRAME") || type.equals ("VIBRATION")) {
type = (fileName != null && fileName.indexOf (".") >= 0 ? fileName.substring (fileName.lastIndexOf (".") + 1).toUpperCase () : "JPG");
}if (type.equals ("MNU")) {
type = "MENU";
} else if (type.equals ("WRL") || type.equals ("VRML")) {
type = "Vrml";
isExport = true;
} else if (type.equals ("X3D")) {
type = "X3d";
isExport = true;
} else if (type.equals ("IDTF")) {
type = "Idtf";
isExport = true;
} else if (type.equals ("MA")) {
type = "Maya";
isExport = true;
} else if (type.equals ("JS")) {
type = "Js";
isExport = true;
} else if (type.equals ("OBJ")) {
type = "Obj";
isExport = true;
} else if (type.equals ("JVXL")) {
type = "ISOSURFACE";
} else if (type.equals ("XJVXL")) {
type = "ISOSURFACE";
} else if (type.equals ("JMOL")) {
type = "ZIPALL";
} else if (type.equals ("HIS")) {
type = "HISTORY";
}if (type.equals ("COORD")) type = (fileName != null && fileName.indexOf (".") >= 0 ? fileName.substring (fileName.lastIndexOf (".") + 1).toUpperCase () : "XYZ");
isImage = J.util.Parser.isOneOf (type, "GIF;JPEG64;JPEG;JPG64;JPG;PPM;PNG;PNGJ;PNGT;SCENE");
if (scripts != null) {
if (type.equals ("PNG")) type = "PNGJ";
if (!type.equals ("PNGJ") && !type.equals ("ZIPALL")) this.error (22);
}if (isImage && isShow) type = "JPG64";
 else if (!isImage && !isExport && !J.util.Parser.isOneOf (type, "SCENE;JMOL;ZIP;ZIPALL;SPT;HISTORY;MO;ISOSURFACE;MESH;PMESH;VAR;FILE;FUNCTION;CD;CML;XYZ;XYZRN;XYZVIB;MENU;MOL;PDB;PGRP;PQR;QUAT;RAMA;SDF;V2000;V3000;INLINE")) this.errorStr2 (54, "COORDS|FILE|FUNCTIONS|HISTORY|IMAGE|INLINE|ISOSURFACE|JMOL|MENU|MO|POINTGROUP|QUATERNION [w,x,y,z] [derivative]|RAMACHANDRAN|SPT|STATE|VAR x|ZIP|ZIPALL  CLIPBOARD", "CML|GIF|JPG|JPG64|JMOL|JVXL|MESH|MOL|PDB|PMESH|PNG|PNGJ|PNGT|PPM|PQR|SDF|V2000|V3000|SPT|XJVXL|XYZ|XYZRN|XYZVIB|ZIP" + driverList.toUpperCase ().$replace (';', '|'));
if (this.chk) return "";
var bytes = null;
var doDefer = false;
if (data == null || isExport) {
data = type.intern ();
if (isExport) {
fullPath[0] = fileName;
data = this.viewer.generateOutputForExport (data, isCommand || fileName != null ? fullPath : null, width, height);
if (data == null || data.length == 0) return "";
if (!isCommand) return data;
if ((type.equals ("Povray") || type.equals ("Idtf")) && fullPath[0] != null) {
var ext = (type.equals ("Idtf") ? ".tex" : ".ini");
fileName = fullPath[0] + ext;
msg = this.viewer.createImageSet (fileName, ext, data, null, null, -2147483648, 0, 0, null, 0, fullPath);
if (type.equals ("Idtf")) data = data.substring (0, data.indexOf ("\\begin{comment}"));
data = "Created " + fullPath[0] + ":\n\n" + data;
} else {
msg = data;
}if (msg != null) {
if (!msg.startsWith ("OK")) this.evalError (msg, null);
this.scriptStatusOrBuffer (data);
}return "";
} else if (data === "MENU") {
data = this.viewer.getMenu ("");
} else if (data === "PGRP") {
data = this.viewer.getPointGroupAsString (type2.equals ("draw"), null, 0, 1.0);
} else if (data === "PDB" || data === "PQR") {
if (isShow) {
data = this.viewer.getPdbData (null, null);
} else {
doDefer = true;
}} else if (data === "FILE") {
if (isShow) data = this.viewer.getCurrentFileAsString ();
 else doDefer = true;
if ("?".equals (fileName)) fileName = "?Jmol." + this.viewer.getParameter ("_fileType");
} else if ((data === "SDF" || data === "MOL" || data === "V2000" || data === "V3000" || data === "CD") && isCoord) {
data = this.viewer.getModelExtract ("selected", true, false, data);
if (data.startsWith ("ERROR:")) bytes = data;
} else if (data === "XYZ" || data === "XYZRN" || data === "XYZVIB" || data === "MOL" || data === "SDF" || data === "V2000" || data === "V3000" || data === "CML" || data === "CD") {
data = this.viewer.getData ("selected", data);
if (data.startsWith ("ERROR:")) bytes = data;
} else if (data === "FUNCTION") {
data = this.viewer.getFunctionCalls (null);
type = "TXT";
} else if (data === "VAR") {
data = (this.getParameter (J.script.SV.sValue (this.tokenAt (isCommand ? 2 : 1, args)), 1073742190)).asString ();
type = "TXT";
} else if (data === "SPT") {
if (isCoord) {
var tainted = this.viewer.getTaintedAtoms (2);
this.viewer.setAtomCoordsRelative (J.util.P3.new3 (0, 0, 0), null);
data = this.viewer.getStateInfo ();
this.viewer.setTaintedAtoms (tainted, 2);
} else {
data = this.viewer.getStateInfo ();
if (localPath != null || remotePath != null) data = J.viewer.FileManager.setScriptFileReferences (data, localPath, remotePath, null);
}} else if (data === "ZIP" || data === "ZIPALL") {
data = this.viewer.getStateInfo ();
bytes = this.viewer.createZip (fileName, type, data, scripts);
} else if (data === "HISTORY") {
data = this.viewer.getSetHistory (2147483647);
type = "SPT";
} else if (data === "MO") {
data = this.getMoJvxl (2147483647);
type = "XJVXL";
} else if (data === "PMESH") {
if ((data = this.getIsosurfaceJvxl (true, 28)) == null) this.error (31);
type = "XJVXL";
} else if (data === "ISOSURFACE" || data === "MESH") {
if ((data = this.getIsosurfaceJvxl (data === "MESH", 24)) == null) this.error (31);
type = (data.indexOf ("<?xml") >= 0 ? "XJVXL" : "JVXL");
if (!isShow) this.showString (this.getShapeProperty (24, "jvxlFileInfo"));
} else {
len = -1;
if (quality < 0) quality = -1;
}if (data == null && !doDefer) data = "";
if (len == 0 && !doDefer) len = (bytes == null ? data.length : Clazz.instanceOf (bytes, String) ? (bytes).length : (bytes).length);
if (isImage) {
this.refresh ();
if (width < 0) width = this.viewer.getScreenWidth ();
if (height < 0) height = this.viewer.getScreenHeight ();
}}if (!isCommand) return data;
if (isShow) {
this.showStringPrint (data, true);
return "";
}if (bytes != null && Clazz.instanceOf (bytes, String)) {
this.scriptStatusOrBuffer (bytes);
return bytes;
}if (type.equals ("SCENE")) bytes = sceneType;
 else if (bytes == null && (!isImage || fileName != null)) bytes = data;
if (doDefer) msg = this.viewer.streamFileData (fileName, type, type2, 0, null);
 else msg = this.viewer.createImageSet (fileName, type, (Clazz.instanceOf (bytes, String) ? bytes : null), (Clazz.instanceOf (bytes, Array) ? bytes : null), scripts, quality, width, height, bsFrames, nVibes, fullPath);
}if (!this.chk && msg != null) {
if (!msg.startsWith ("OK")) this.evalError (msg, null);
this.scriptStatusOrBuffer (msg + (isImage ? "; width=" + width + "; height=" + height : ""));
return msg;
}return "";
}, "~A");
$_M(c$, "show", 
($fz = function () {
var value = null;
var str = this.parameterAsString (1);
var msg = null;
var name = null;
var len = 2;
var token = this.getToken (1);
var tok = (Clazz.instanceOf (token, J.script.SV) ? 0 : token.tok);
if (tok == 4) {
token = J.script.T.getTokenFromName (str.toLowerCase ());
if (token != null) tok = token.tok;
}if (tok != 1297090050 && tok != 1073742158) this.checkLength (-3);
if (this.slen == 2 && str.indexOf ("?") >= 0) {
this.showString (this.viewer.getAllSettings (str.substring (0, str.indexOf ("?"))));
return;
}switch (tok) {
case 0:
if (!this.chk) msg = (this.theToken).escape ();
break;
case 135270422:
if (!this.chk) msg = J.util.Escape.e (this.viewer.cacheList ());
break;
case 1073741915:
this.checkLength (2);
if (!this.chk) msg = this.viewer.calculateStructures (null, true, false);
break;
case 545259570:
this.checkLength (2);
if (!this.chk) msg = this.viewer.getPathForAllFiles ();
break;
case 1073742038:
case 135267336:
case 1073741929:
case 1073741879:
this.checkLength (tok == 1073741879 ? 3 : 2);
if (this.chk) return;
msg = this.viewer.getSmiles (0, 0, this.viewer.getSelectionSet (false), false, true, false, false);
switch (tok) {
case 1073741929:
if (msg.length > 0) {
this.viewer.show2D (msg);
return;
}msg = "Could not show drawing -- Either insufficient atoms are selected or the model is a PDB file.";
break;
case 1073742038:
if (msg.length > 0) {
this.viewer.showNMR (msg);
return;
}msg = "Could not show nmr -- Either insufficient atoms are selected or the model is a PDB file.";
break;
case 1073741879:
len = 3;
var info = null;
if (msg.length > 0) {
var type = '/';
switch (this.getToken (2).tok) {
case 1073741977:
type = 'I';
break;
case 1073741978:
type = 'K';
break;
case 1073742035:
type = 'N';
break;
default:
info = this.parameterAsString (2);
}
msg = this.viewer.getChemicalInfo (msg, type, info);
if (msg.indexOf ("FileNotFound") >= 0) msg = "?";
} else {
msg = "Could not show name -- Either insufficient atoms are selected or the model is a PDB file.";
}}
break;
case 1297090050:
if (this.slen > 3) {
var pt1 = this.centerParameter (2);
var pt2 = this.centerParameter (++this.iToken);
if (!this.chk) msg = this.viewer.getSymmetryOperation (null, 0, pt1, pt2, false);
len = ++this.iToken;
} else {
var iop = (this.checkLength23 () == 2 ? 0 : this.intParameter (2));
if (!this.chk) msg = this.viewer.getSymmetryOperation (null, iop, null, null, false);
len = -3;
}break;
case 1649412112:
var vdwType = null;
if (this.slen > 2) {
vdwType = J.constant.EnumVdw.getVdwType (this.parameterAsString (2));
if (vdwType == null) this.error (22);
}if (!this.chk) this.showString (this.viewer.getDefaultVdwTypeNameOrData (0, vdwType));
return;
case 135368713:
this.checkLength23 ();
if (!this.chk) this.showString (this.viewer.getFunctionCalls (this.optParameterAsString (2)));
return;
case 1085443:
this.checkLength (2);
if (!this.chk) this.showString (this.viewer.getAllSettings (null));
return;
case 1074790760:
if ((len = this.slen) == 2) {
if (!this.chk) this.viewer.showUrl (this.getFullPathName ());
return;
}name = this.parameterAsString (2);
if (!this.chk) this.viewer.showUrl (name);
return;
case 1766856708:
str = "defaultColorScheme";
break;
case 1610612740:
str = "scaleAngstromsPerInch";
break;
case 135270417:
case 1052714:
if (this.chk) return;
var modelIndex = this.viewer.getCurrentModelIndex ();
if (modelIndex < 0) this.errorStr (30, "show " + this.theToken.value);
msg = this.plot (this.st);
len = this.slen;
break;
case 1113200654:
if (!this.chk) msg = this.getContext (false);
break;
case 1073741888:
name = this.optParameterAsString (2);
if (name.length > 0) len = 3;
if (!this.chk) value = this.viewer.getColorSchemeList (name);
break;
case 1073742192:
if (!this.chk) msg = this.viewer.getAtomDefs (this.definedAtomSets) + this.viewer.getVariableList () + this.getContext (true);
break;
case 536870926:
if (!this.chk) msg = this.viewer.getTrajectoryState ();
break;
case 553648148:
value = "" + this.commandHistoryLevelMax;
break;
case 553648150:
value = "" + J.util.Logger.getLogLevel ();
break;
case 603979824:
value = "" + this.viewer.getBoolean (603979824);
break;
case 553648178:
msg = "set strandCountForStrands " + this.viewer.getStrandCount (12) + "; set strandCountForMeshRibbon " + this.viewer.getStrandCount (13);
break;
case 536875070:
msg = this.viewer.showTimeout ((len = this.slen) == 2 ? null : this.parameterAsString (2));
break;
case 536870918:
value = J.util.Escape.eP (this.viewer.getDefaultLattice ());
break;
case 4126:
if (!this.chk) msg = this.viewer.getMinimizationInfo ();
break;
case 1611272194:
switch (this.viewer.getAxesMode ()) {
case J.constant.EnumAxesMode.UNITCELL:
msg = "set axesUnitcell";
break;
case J.constant.EnumAxesMode.BOUNDBOX:
msg = "set axesWindow";
break;
default:
msg = "set axesMolecular";
}
break;
case 1610612737:
msg = "set bondMode " + (this.viewer.getBoolean (603979812) ? "OR" : "AND");
break;
case 1650071565:
if (!this.chk) msg = "set strandCountForStrands " + this.viewer.getStrandCount (12) + "; set strandCountForMeshRibbon " + this.viewer.getStrandCount (13);
break;
case 1612189718:
msg = "set hbondsBackbone " + this.viewer.getBoolean (603979852) + ";set hbondsSolid " + this.viewer.getBoolean (603979854);
break;
case 1611141175:
if (!this.chk) msg = this.viewer.getSpinState ();
break;
case 1611141176:
msg = "set ssbondsBackbone " + this.viewer.getBoolean (603979952);
break;
case 1610625028:
case 1611141171:
msg = "selectionHalos " + (this.viewer.getSelectionHaloEnabled (false) ? "ON" : "OFF");
break;
case 1613758470:
msg = "set selectHetero " + this.viewer.getBoolean (1613758470);
break;
case 1073741828:
msg = J.util.Escape.eAP (this.viewer.getAdditionalHydrogens (null, true, true, null));
break;
case 1613758476:
msg = "set selectHydrogens " + this.viewer.getBoolean (1613758476);
break;
case 553648130:
case 553648142:
case 536870924:
case 553648176:
case 553648172:
case 1073741995:
if (!this.chk) msg = this.viewer.getSpecularState ();
break;
case 4146:
if (!this.chk) msg = this.viewer.listSavedStates ();
break;
case 1614417948:
if (!this.chk) msg = this.viewer.getUnitCellInfoText ();
break;
case 1048582:
if ((len = this.slen) == 2) {
if (!this.chk) msg = this.viewer.getCoordinateState (this.viewer.getSelectionSet (false));
break;
}var nameC = this.parameterAsString (2);
if (!this.chk) msg = this.viewer.getSavedCoordinates (nameC);
break;
case 1073742158:
if (!this.chk) this.viewer.clearConsole ();
if ((len = this.slen) == 2) {
if (!this.chk) msg = this.viewer.getStateInfo ();
break;
}name = this.parameterAsString (2);
if (name.equals ("/") && (len = this.slen) == 4) {
name = this.parameterAsString (3).toLowerCase ();
if (!this.chk) {
var info = J.util.TextFormat.split (this.viewer.getStateInfo (), '\n');
var sb =  new J.util.SB ();
for (var i = 0; i < info.length; i++) if (info[i].toLowerCase ().indexOf (name) >= 0) sb.append (info[i]).appendC ('\n');

msg = sb.toString ();
}break;
} else if (this.tokAt (2) == 1229984263 && (len = this.slen) == 4) {
if (!this.chk) msg = this.viewer.getEmbeddedFileState (this.parameterAsString (3));
break;
}len = 3;
if (!this.chk) msg = this.viewer.getSavedState (name);
break;
case 1641025539:
if ((len = this.slen) == 2) {
if (!this.chk) msg = this.viewer.getProteinStructureState ();
break;
}var shape = this.parameterAsString (2);
if (!this.chk) msg = this.viewer.getSavedStructure (shape);
break;
case 135270407:
var type = ((len = this.slen) == 3 ? this.parameterAsString (2) : null);
if (!this.chk) {
var data = (type == null ? this.$data : this.viewer.getData (type));
msg = (data == null ? "no data" : J.util.Escape.encapsulateData (data[0], data[1], (data[3]).intValue ()));
}break;
case 1073742152:
var info = null;
if ((len = this.slen) == 2) {
if (!this.chk) {
info = this.viewer.getSpaceGroupInfo (null);
}} else {
var sg = this.parameterAsString (2);
if (!this.chk) info = this.viewer.getSpaceGroupInfo (J.util.TextFormat.simpleReplace (sg, "''", "\""));
}if (info != null) msg = "" + info.get ("spaceGroupInfo") + info.get ("symmetryInfo");
break;
case 1048583:
len = 3;
msg = this.setObjectProperty ();
break;
case 1679429641:
if (!this.chk) {
msg = this.viewer.getBoundBoxCommand (true);
}break;
case 12289:
if (!this.chk) msg = "center " + J.util.Escape.eP (this.viewer.getRotationCenter ());
break;
case 135176:
if (!this.chk) msg = this.getShapeProperty (22, "command");
break;
case 1229984263:
if (!this.chk) this.viewer.clearConsole ();
if (this.slen == 2) {
if (!this.chk) msg = this.viewer.getCurrentFileAsString ();
if (msg == null) msg = "<unavailable>";
break;
}len = 3;
value = this.parameterAsString (2);
if (!this.chk) msg = this.viewer.getFileAsString (value);
break;
case 4115:
if (this.tokAt (2) == 1048579 && (len = 3) > 0) msg = this.viewer.getModelFileInfoAll ();
 else msg = this.viewer.getModelFileInfo ();
break;
case 1610616855:
var n = ((len = this.slen) == 2 ? 2147483647 : this.intParameter (2));
if (n < 1) this.error (22);
if (!this.chk) {
this.viewer.clearConsole ();
if (this.scriptLevel == 0) this.viewer.removeCommand ();
msg = this.viewer.getSetHistory (n);
}break;
case 135180:
if (!this.chk) msg = this.getShapeProperty (24, "jvxlDataXml");
break;
case 1183762:
if (this.optParameterAsString (2).equalsIgnoreCase ("list")) {
msg = this.viewer.getMoInfo (-1);
len = 3;
} else {
var ptMO = ((len = this.slen) == 2 ? -2147483648 : this.intParameter (2));
if (!this.chk) msg = this.getMoJvxl (ptMO);
}break;
case 1095766028:
if (!this.chk) msg = this.viewer.getModelInfoAsString ();
break;
case 537006096:
if (!this.chk) msg = this.viewer.getMeasurementInfoAsString ();
break;
case 1073742178:
case 1073742132:
case 4130:
if (!this.chk) msg = this.viewer.getOrientationText (tok, null);
break;
case 1073742077:
len = 2;
if (this.slen > 3) break;
switch (tok = this.tokAt (2)) {
case 1073742178:
case 1073742132:
case 4130:
case 0:
if (!this.chk) msg = this.viewer.getOrientationText (tok, null);
break;
default:
name = this.optParameterAsString (2);
msg = this.viewer.getOrientationText (0, name);
}
len = this.slen;
break;
case 1073742088:
if (!this.chk) msg = this.viewer.getPDBHeader ();
break;
case 1073742102:
this.pointGroup ();
return;
case 1089470478:
if (!this.chk) msg = this.viewer.getSymmetryInfoAsString ();
break;
case 1073742176:
if (!this.chk) msg = "transform:\n" + this.viewer.getTransformText ();
break;
case 4168:
msg = "zoom " + (this.viewer.getZoomEnabled () ? ("" + this.viewer.getZoomSetting ()) : "off");
break;
case 1611272202:
msg = (this.viewer.getShowFrank () ? "frank ON" : "frank OFF");
break;
case 1666189314:
str = "solventProbeRadius";
break;
case 1073741864:
case 1087373316:
case 1087373320:
case 1073742120:
case 1114638350:
case 1087373318:
case 1141899265:
case 1073741982:
msg = this.viewer.getChimeInfo (tok);
break;
case 537022465:
case 1610612738:
case 1716520973:
case 20482:
case 1613758488:
value = "?";
break;
case 1073741824:
if (str.equalsIgnoreCase ("fileHeader")) {
if (!this.chk) msg = this.viewer.getPDBHeader ();
} else if (str.equalsIgnoreCase ("menu")) {
if (!this.chk) value = this.viewer.getMenu ("");
} else if (str.equalsIgnoreCase ("mouse")) {
var qualifiers = ((len = this.slen) == 2 ? null : this.parameterAsString (2));
if (!this.chk) msg = this.viewer.getBindingInfo (qualifiers);
}break;
}
this.checkLength (len);
if (this.chk) return;
if (msg != null) this.showString (msg);
 else if (value != null) this.showString (str + " = " + value);
 else if (str != null) {
if (str.indexOf (" ") >= 0) this.showString (str);
 else this.showString (str + " = " + this.getParameterEscaped (str));
}}, $fz.isPrivate = true, $fz));
$_M(c$, "getIsosurfaceJvxl", 
($fz = function (asMesh, iShape) {
if (this.chk) return "";
return this.getShapeProperty (iShape, asMesh ? "jvxlMeshX" : "jvxlDataXml");
}, $fz.isPrivate = true, $fz), "~B,~N");
$_M(c$, "getMoJvxl", 
($fz = function (ptMO) {
this.sm.loadShape (27);
var modelIndex = this.viewer.getCurrentModelIndex ();
if (modelIndex < 0) this.errorStr (30, "MO isosurfaces");
var moData = this.viewer.getModelAuxiliaryInfoValue (modelIndex, "moData");
if (moData == null) this.error (27);
var n = this.getShapeProperty (27, "moNumber");
if (n == null || n.intValue () == 0) {
this.setShapeProperty (27, "init", Integer.$valueOf (modelIndex));
} else if (ptMO == 2147483647) {
}this.setShapeProperty (27, "moData", moData);
return this.getShapePropertyIndex (27, "showMO", ptMO);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "cgo", 
($fz = function () {
System.out.println ("CGO command not implemented");
}, $fz.isPrivate = true, $fz));
$_M(c$, "draw", 
($fz = function () {
this.sm.loadShape (22);
switch (this.tokAt (1)) {
case 1073742001:
if (this.listIsosurface (22)) return;
break;
case 1073742102:
this.pointGroup ();
return;
case 137363468:
case 135270417:
case 1052714:
this.plot (this.st);
return;
}
var havePoints = false;
var isInitialized = false;
var isSavedState = false;
var isTranslucent = false;
var isIntersect = false;
var isFrame = false;
var plane;
var tokIntersect = 0;
var translucentLevel = 3.4028235E38;
var colorArgb = -2147483648;
var intScale = 0;
var swidth = "";
var iptDisplayProperty = 0;
var center = null;
var thisId = this.initIsosurface (22);
var idSeen = (thisId != null);
var isWild = (idSeen && this.getShapeProperty (22, "ID") == null);
var connections = null;
var iConnect = 0;
for (var i = this.iToken; i < this.slen; ++i) {
var propertyName = null;
var propertyValue = null;
switch (this.getToken (i).tok) {
case 1614417948:
case 1679429641:
if (this.chk) break;
var vp = this.viewer.getPlaneIntersection (this.theTok, null, intScale / 100, 0);
intScale = 0;
propertyName = "polygon";
propertyValue = vp;
havePoints = true;
break;
case 4106:
connections =  Clazz.newIntArray (4, 0);
iConnect = 4;
var farray = this.floatParameterSet (++i, 4, 4);
i = this.iToken;
for (var j = 0; j < 4; j++) connections[j] = Clazz.floatToInt (farray[j]);

havePoints = true;
break;
case 1678770178:
case 1141899265:
if (connections == null || iConnect > (this.theTok == 1095761924 ? 2 : 3)) {
iConnect = 0;
connections = [-1, -1, -1, -1];
}connections[iConnect++] = this.atomExpressionAt (++i).nextSetBit (0);
i = this.iToken;
connections[iConnect++] = (this.theTok == 1678770178 ? this.atomExpressionAt (++i).nextSetBit (0) : -1);
i = this.iToken;
havePoints = true;
break;
case 554176565:
switch (this.getToken (++i).tok) {
case 1048583:
propertyName = "slab";
propertyValue = this.objectNameParameter (++i);
i = this.iToken;
havePoints = true;
break;
default:
this.error (22);
}
break;
case 135267842:
switch (this.getToken (++i).tok) {
case 1614417948:
case 1679429641:
tokIntersect = this.theTok;
isIntersect = true;
continue;
case 1048583:
propertyName = "intersect";
propertyValue = this.objectNameParameter (++i);
i = this.iToken;
isIntersect = true;
havePoints = true;
break;
default:
this.error (22);
}
break;
case 1073742106:
propertyName = "polygon";
havePoints = true;
var v =  new J.util.JmolList ();
var nVertices = 0;
var nTriangles = 0;
var points = null;
var vpolygons = null;
if (this.isArrayParameter (++i)) {
points = this.getPointArray (i, -1);
nVertices = points.length;
} else {
nVertices = Math.max (0, this.intParameter (i));
points =  new Array (nVertices);
for (var j = 0; j < nVertices; j++) points[j] = this.centerParameter (++this.iToken);

}switch (this.getToken (++this.iToken).tok) {
case 11:
case 12:
var sv = J.script.SV.newScriptVariableToken (this.theToken);
sv.toArray ();
vpolygons = sv.getList ();
nTriangles = vpolygons.size ();
break;
case 7:
vpolygons = (this.theToken).getList ();
nTriangles = vpolygons.size ();
break;
default:
nTriangles = Math.max (0, this.intParameter (this.iToken));
}
var polygons = J.util.ArrayUtil.newInt2 (nTriangles);
for (var j = 0; j < nTriangles; j++) {
var f = (vpolygons == null ? this.floatParameterSet (++this.iToken, 3, 4) : J.script.SV.flistValue (vpolygons.get (j), 0));
if (f.length < 3 || f.length > 4) this.error (22);
polygons[j] = [Clazz.floatToInt (f[0]), Clazz.floatToInt (f[1]), Clazz.floatToInt (f[2]), (f.length == 3 ? 7 : Clazz.floatToInt (f[3]))];
}
if (nVertices > 0) {
v.addLast (points);
v.addLast (polygons);
} else {
v = null;
}propertyValue = v;
i = this.iToken;
break;
case 1297090050:
var xyz = null;
var iSym = 0;
plane = null;
var target = null;
switch (this.tokAt (++i)) {
case 4:
xyz = this.stringParameter (i);
break;
case 12:
xyz = J.script.SV.sValue (this.getToken (i));
break;
case 2:
default:
if (!this.isCenterParameter (i)) iSym = this.intParameter (i++);
if (this.isCenterParameter (i)) center = this.centerParameter (i);
if (this.isCenterParameter (this.iToken + 1)) target = this.centerParameter (++this.iToken);
if (this.chk) return;
i = this.iToken;
}
var bsAtoms = null;
if (center == null && i + 1 < this.slen) {
center = this.centerParameter (++i);
bsAtoms = (this.tokAt (i) == 10 || this.tokAt (i) == 1048577 ? this.atomExpressionAt (i) : null);
i = this.iToken + 1;
}this.checkLast (this.iToken);
if (!this.chk) this.runScript (this.viewer.getSymmetryInfo (bsAtoms, xyz, iSym, center, target, thisId, 135176));
return;
case 4115:
isFrame = true;
continue;
case 1048586:
case 9:
case 8:
if (this.theTok == 9 || !this.isPoint3f (i)) {
propertyValue = this.getPoint4f (i);
if (isFrame) {
this.checkLast (this.iToken);
if (!this.chk) this.runScript ((J.util.Quaternion.newP4 (propertyValue)).draw ((thisId == null ? "frame" : thisId), " " + swidth, (center == null ?  new J.util.P3 () : center), intScale / 100));
return;
}propertyName = "planedef";
} else {
propertyValue = center = this.getPoint3f (i, true);
propertyName = "coord";
}i = this.iToken;
havePoints = true;
break;
case 135267841:
case 135266319:
if (!havePoints && !isIntersect && tokIntersect == 0 && this.theTok != 135267841) {
propertyName = "plane";
break;
}if (this.theTok == 135266319) {
plane = this.planeParameter (++i);
} else {
plane = this.hklParameter (++i);
}i = this.iToken;
if (tokIntersect != 0) {
if (this.chk) break;
var vpc = this.viewer.getPlaneIntersection (tokIntersect, plane, intScale / 100, 0);
intScale = 0;
propertyName = "polygon";
propertyValue = vpc;
} else {
propertyValue = plane;
propertyName = "planedef";
}havePoints = true;
break;
case 1073742000:
propertyName = "lineData";
propertyValue = this.floatParameterSet (++i, 0, 2147483647);
i = this.iToken;
havePoints = true;
break;
case 10:
case 1048577:
propertyName = "atomSet";
propertyValue = this.atomExpressionAt (i);
if (isFrame) center = this.centerParameter (i);
i = this.iToken;
havePoints = true;
break;
case 7:
propertyName = "modelBasedPoints";
propertyValue = J.script.SV.listValue (this.theToken);
havePoints = true;
break;
case 1073742195:
case 269484080:
break;
case 269484096:
propertyValue = this.xypParameter (i);
if (propertyValue != null) {
i = this.iToken;
propertyName = "coord";
havePoints = true;
break;
}if (isSavedState) this.error (22);
isSavedState = true;
break;
case 269484097:
if (!isSavedState) this.error (22);
isSavedState = false;
break;
case 1141899269:
propertyName = "reverse";
break;
case 4:
propertyValue = this.stringParameter (i);
propertyName = "title";
break;
case 135198:
propertyName = "vector";
break;
case 1141899267:
propertyValue = Float.$valueOf (this.floatParameter (++i));
propertyName = "length";
break;
case 3:
propertyValue = Float.$valueOf (this.floatParameter (i));
propertyName = "length";
break;
case 1095761933:
propertyName = "modelIndex";
propertyValue = Integer.$valueOf (this.intParameter (++i));
break;
case 2:
if (isSavedState) {
propertyName = "modelIndex";
propertyValue = Integer.$valueOf (this.intParameter (i));
} else {
intScale = this.intParameter (i);
}break;
case 1073742138:
if (++i >= this.slen) this.error (34);
switch (this.getToken (i).tok) {
case 2:
intScale = this.intParameter (i);
continue;
case 3:
intScale = Math.round (this.floatParameter (i) * 100);
continue;
}
this.error (34);
break;
case 1074790550:
thisId = this.setShapeId (22, ++i, idSeen);
isWild = (this.getShapeProperty (22, "ID") == null);
i = this.iToken;
break;
case 1073742028:
propertyName = "fixed";
propertyValue = Boolean.FALSE;
break;
case 1060869:
propertyName = "fixed";
propertyValue = Boolean.TRUE;
break;
case 1073742066:
var pt = this.getPoint3f (++i, true);
i = this.iToken;
propertyName = "offset";
propertyValue = pt;
break;
case 1073741906:
propertyName = "crossed";
break;
case 1073742196:
propertyValue = Float.$valueOf (this.floatParameter (++i));
propertyName = "width";
swidth = propertyName + " " + propertyValue;
break;
case 1073741998:
propertyName = "line";
propertyValue = Boolean.TRUE;
break;
case 1073741908:
propertyName = "curve";
break;
case 1074790416:
propertyName = "arc";
break;
case 1073741846:
propertyName = "arrow";
break;
case 1073741880:
propertyName = "circle";
break;
case 1073741912:
propertyName = "cylinder";
break;
case 1073742194:
propertyName = "vertices";
break;
case 1073742048:
propertyName = "nohead";
break;
case 1073741861:
propertyName = "isbarb";
break;
case 1073742130:
propertyName = "rotate45";
break;
case 1073742092:
propertyName = "perp";
break;
case 1666189314:
case 1073741916:
var isRadius = (this.theTok == 1666189314);
var f = this.floatParameter (++i);
if (isRadius) f *= 2;
propertyValue = Float.$valueOf (f);
propertyName = (isRadius || this.tokAt (i) == 3 ? "width" : "diameter");
swidth = propertyName + (this.tokAt (i) == 3 ? " " + f : " " + (Clazz.floatToInt (f)));
break;
case 1048583:
if ((this.tokAt (i + 2) == 269484096 || isFrame)) {
var pto = center = this.centerParameter (i);
i = this.iToken;
propertyName = "coord";
propertyValue = pto;
havePoints = true;
break;
}propertyValue = this.objectNameParameter (++i);
propertyName = "identifier";
havePoints = true;
break;
case 1766856708:
case 1073742180:
case 1073742074:
if (this.theTok != 1766856708) --i;
if (this.tokAt (i + 1) == 1073742180) {
i++;
isTranslucent = true;
if (this.isFloatParameter (i + 1)) translucentLevel = this.getTranslucentLevel (++i);
} else if (this.tokAt (i + 1) == 1073742074) {
i++;
isTranslucent = true;
translucentLevel = 0;
}if (this.isColorParam (i + 1)) {
colorArgb = this.getArgbParam (++i);
i = this.iToken;
} else if (!isTranslucent) {
this.error (22);
}idSeen = true;
continue;
default:
if (!this.setMeshDisplayProperty (22, 0, this.theTok)) {
if (this.theTok == 269484209 || J.script.T.tokAttr (this.theTok, 1073741824)) {
thisId = this.setShapeId (22, i, idSeen);
i = this.iToken;
break;
}this.error (22);
}if (iptDisplayProperty == 0) iptDisplayProperty = i;
i = this.iToken;
continue;
}
idSeen = (this.theTok != 12291);
if (havePoints && !isInitialized && !isFrame) {
this.setShapeProperty (22, "points", Integer.$valueOf (intScale));
isInitialized = true;
intScale = 0;
}if (havePoints && isWild) this.error (22);
if (propertyName != null) this.setShapeProperty (22, propertyName, propertyValue);
}
if (havePoints) {
this.setShapeProperty (22, "set", connections);
}if (colorArgb != -2147483648) this.setShapeProperty (22, "color", Integer.$valueOf (colorArgb));
if (isTranslucent) this.setShapeTranslucency (22, "", "translucent", translucentLevel, null);
if (intScale != 0) {
this.setShapeProperty (22, "scale", Integer.$valueOf (intScale));
}if (iptDisplayProperty > 0) {
if (!this.setMeshDisplayProperty (22, iptDisplayProperty, 0)) this.error (22);
}}, $fz.isPrivate = true, $fz));
$_M(c$, "polyhedra", 
($fz = function () {
var needsGenerating = false;
var onOffDelete = false;
var typeSeen = false;
var edgeParameterSeen = false;
var isDesignParameter = false;
var lighting = 0;
var nAtomSets = 0;
this.sm.loadShape (21);
this.setShapeProperty (21, "init", null);
var setPropertyName = "centers";
var decimalPropertyName = "radius_";
var isTranslucent = false;
var translucentLevel = 3.4028235E38;
var color = -2147483648;
for (var i = 1; i < this.slen; ++i) {
var propertyName = null;
var propertyValue = null;
switch (this.getToken (i).tok) {
case 12291:
case 1048589:
case 1048588:
if (i + 1 != this.slen || needsGenerating || nAtomSets > 1 || nAtomSets == 0 && "to".equals (setPropertyName)) this.error (18);
propertyName = (this.theTok == 1048588 ? "off" : this.theTok == 1048589 ? "on" : "delete");
onOffDelete = true;
break;
case 269484436:
case 269484080:
continue;
case 1678770178:
if (nAtomSets > 0) this.error (23);
needsGenerating = true;
propertyName = "bonds";
break;
case 1666189314:
decimalPropertyName = "radius";
continue;
case 2:
case 3:
if (nAtomSets > 0 && !isDesignParameter) this.error (23);
if (this.theTok == 2) {
if (decimalPropertyName === "radius_") {
propertyName = "nVertices";
propertyValue = Integer.$valueOf (this.intParameter (i));
needsGenerating = true;
break;
}}propertyName = (decimalPropertyName === "radius_" ? "radius" : decimalPropertyName);
propertyValue = Float.$valueOf (this.floatParameter (i));
decimalPropertyName = "radius_";
isDesignParameter = false;
needsGenerating = true;
break;
case 10:
case 1048577:
if (typeSeen) this.error (23);
if (++nAtomSets > 2) this.error (2);
if ("to".equals (setPropertyName)) needsGenerating = true;
propertyName = setPropertyName;
setPropertyName = "to";
propertyValue = this.atomExpressionAt (i);
i = this.iToken;
break;
case 1074790746:
if (nAtomSets > 1) this.error (23);
if (this.tokAt (i + 1) == 10 || this.tokAt (i + 1) == 1048577 && !needsGenerating) {
propertyName = "toBitSet";
propertyValue = this.atomExpressionAt (++i);
i = this.iToken;
needsGenerating = true;
break;
} else if (!needsGenerating) {
this.error (19);
}setPropertyName = "to";
continue;
case 1073741937:
if (!needsGenerating) this.error (19);
decimalPropertyName = "faceCenterOffset";
isDesignParameter = true;
continue;
case 1073741924:
if (!needsGenerating) this.error (19);
decimalPropertyName = "distanceFactor";
isDesignParameter = true;
continue;
case 1766856708:
case 1073742180:
case 1073742074:
isTranslucent = false;
if (this.theTok != 1766856708) --i;
if (this.tokAt (i + 1) == 1073742180) {
i++;
isTranslucent = true;
if (this.isFloatParameter (i + 1)) translucentLevel = this.getTranslucentLevel (++i);
} else if (this.tokAt (i + 1) == 1073742074) {
i++;
isTranslucent = true;
translucentLevel = 0;
}if (this.isColorParam (i + 1)) {
color = this.getArgbParam (i);
i = this.iToken;
} else if (!isTranslucent) this.error (22);
continue;
case 1073741886:
case 1073741948:
propertyName = "collapsed";
propertyValue = (this.theTok == 1073741886 ? Boolean.TRUE : Boolean.FALSE);
if (typeSeen) this.error (18);
typeSeen = true;
break;
case 1073742044:
case 1073741934:
case 1073741956:
if (edgeParameterSeen) this.error (18);
propertyName = this.parameterAsString (i);
edgeParameterSeen = true;
break;
case 1073741964:
lighting = this.theTok;
continue;
default:
if (this.isColorParam (i)) {
color = this.getArgbParam (i);
i = this.iToken;
continue;
}this.error (22);
}
this.setShapeProperty (21, propertyName, propertyValue);
if (onOffDelete) return;
}
if (!needsGenerating && !typeSeen && !edgeParameterSeen && lighting == 0) this.error (19);
if (needsGenerating) this.setShapeProperty (21, "generate", null);
if (color != -2147483648) this.setShapeProperty (21, "colorThis", Integer.$valueOf (color));
if (isTranslucent) this.setShapeTranslucency (21, "", "translucentThis", translucentLevel, null);
if (lighting != 0) this.setShapeProperty (21, "token", Integer.$valueOf (lighting));
this.setShapeProperty (21, "init", null);
}, $fz.isPrivate = true, $fz));
$_M(c$, "contact", 
($fz = function () {
this.sm.loadShape (25);
if (this.tokAt (1) == 1073742001 && this.listIsosurface (25)) return;
var iptDisplayProperty = 0;
this.iToken = 1;
var thisId = this.initIsosurface (25);
var idSeen = (thisId != null);
var isWild = (idSeen && this.getShapeProperty (25, "ID") == null);
var bsA = null;
var bsB = null;
var bs = null;
var rd = null;
var params = null;
var colorDensity = false;
var sbCommand =  new J.util.SB ();
var minSet = 2147483647;
var displayType = 135266319;
var contactType = 0;
var distance = NaN;
var saProbeRadius = NaN;
var localOnly = true;
var intramolecular = null;
var userSlabObject = null;
var colorpt = 0;
var colorByType = false;
var tok;
var okNoAtoms = (this.iToken > 1);
for (var i = this.iToken; i < this.slen; ++i) {
switch (tok = this.getToken (i).tok) {
default:
okNoAtoms = true;
if (!this.setMeshDisplayProperty (25, 0, this.theTok)) {
if (this.theTok != 269484209 && !J.script.T.tokAttr (this.theTok, 1073741824)) this.error (22);
thisId = this.setShapeId (25, i, idSeen);
i = this.iToken;
break;
}if (iptDisplayProperty == 0) iptDisplayProperty = i;
i = this.iToken;
continue;
case 1074790550:
okNoAtoms = true;
this.setShapeId (25, ++i, idSeen);
isWild = (this.getShapeProperty (25, "ID") == null);
i = this.iToken;
break;
case 1766856708:
switch (this.tokAt (i + 1)) {
case 1073741914:
tok = 0;
colorDensity = true;
sbCommand.append (" color density");
i++;
break;
case 1141899272:
tok = 0;
colorByType = true;
sbCommand.append (" color type");
i++;
break;
}
if (tok == 0) break;
case 1073742180:
case 1073742074:
okNoAtoms = true;
if (colorpt == 0) colorpt = i;
this.setMeshDisplayProperty (25, i, this.theTok);
i = this.iToken;
break;
case 554176565:
okNoAtoms = true;
userSlabObject = this.getCapSlabObject (i, false);
this.setShapeProperty (25, "slab", userSlabObject);
i = this.iToken;
break;
case 1073741914:
colorDensity = true;
sbCommand.append (" density");
if (this.isFloatParameter (i + 1)) {
if (params == null) params =  Clazz.newFloatArray (1, 0);
params[0] = -Math.abs (this.floatParameter (++i));
sbCommand.append (" " + -params[0]);
}break;
case 1073742122:
var resolution = this.floatParameter (++i);
if (resolution > 0) {
sbCommand.append (" resolution ").appendF (resolution);
this.setShapeProperty (25, "resolution", Float.$valueOf (resolution));
}break;
case 135266324:
case 1276118018:
distance = this.floatParameter (++i);
sbCommand.append (" within ").appendF (distance);
break;
case 269484193:
case 2:
case 3:
rd = this.encodeRadiusParameter (i, false, false);
sbCommand.append (" ").appendO (rd);
i = this.iToken;
break;
case 1073741990:
case 1073741989:
intramolecular = (tok == 1073741989 ? Boolean.TRUE : Boolean.FALSE);
sbCommand.append (" ").appendO (this.theToken.value);
break;
case 1073742020:
minSet = this.intParameter (++i);
break;
case 1612189718:
case 1073741881:
case 1649412112:
contactType = tok;
sbCommand.append (" ").appendO (this.theToken.value);
break;
case 1073742136:
if (this.isFloatParameter (i + 1)) saProbeRadius = this.floatParameter (++i);
case 1074790451:
case 1073742036:
case 3145756:
localOnly = false;
case 1276117510:
case 1073741961:
case 135266319:
case 4106:
displayType = tok;
sbCommand.append (" ").appendO (this.theToken.value);
if (tok == 1073742136) sbCommand.append (" ").appendF (saProbeRadius);
break;
case 1073742083:
params = this.floatParameterSet (++i, 1, 10);
i = this.iToken;
break;
case 10:
case 1048577:
if (isWild || bsB != null) this.error (22);
bs = J.util.BSUtil.copy (this.atomExpressionAt (i));
i = this.iToken;
if (bsA == null) bsA = bs;
 else bsB = bs;
sbCommand.append (" ").append (J.util.Escape.eBS (bs));
break;
}
idSeen = (this.theTok != 12291);
}
if (!okNoAtoms && bsA == null) this.error (13);
if (this.chk) return;
if (bsA != null) {
if (contactType == 1649412112 && rd == null) rd =  new J.atomdata.RadiusData (null, 0, J.atomdata.RadiusData.EnumType.OFFSET, J.constant.EnumVdw.AUTO);
var rd1 = (rd == null ?  new J.atomdata.RadiusData (null, 0.26, J.atomdata.RadiusData.EnumType.OFFSET, J.constant.EnumVdw.AUTO) : rd);
if (displayType == 1073742036 && bsB == null && intramolecular != null && intramolecular.booleanValue ()) bsB = bsA;
 else bsB = this.setContactBitSets (bsA, bsB, localOnly, distance, rd1, true);
switch (displayType) {
case 1074790451:
case 1073742136:
var bsSolvent = this.lookupIdentifierValue ("solvent");
bsA.andNot (bsSolvent);
bsB.andNot (bsSolvent);
bsB.andNot (bsA);
break;
case 3145756:
bsB.andNot (bsA);
break;
case 1073742036:
if (minSet == 2147483647) minSet = 100;
this.setShapeProperty (25, "minset", Integer.$valueOf (minSet));
sbCommand.append (" minSet ").appendI (minSet);
if (params == null) params = [0.5, 2];
}
if (intramolecular != null) {
params = (params == null ?  Clazz.newFloatArray (2, 0) : J.util.ArrayUtil.ensureLengthA (params, 2));
params[1] = (intramolecular.booleanValue () ? 1 : 2);
}if (params != null) sbCommand.append (" parameters ").append (J.util.Escape.eAF (params));
this.setShapeProperty (25, "set", [Integer.$valueOf (contactType), Integer.$valueOf (displayType), Boolean.$valueOf (colorDensity), Boolean.$valueOf (colorByType), bsA, bsB, rd, Float.$valueOf (saProbeRadius), params, sbCommand.toString ()]);
if (colorpt > 0) this.setMeshDisplayProperty (25, colorpt, 0);
}if (iptDisplayProperty > 0) {
if (!this.setMeshDisplayProperty (25, iptDisplayProperty, 0)) this.error (22);
}if (userSlabObject != null && bsA != null) this.setShapeProperty (25, "slab", userSlabObject);
if (bsA != null && (displayType == 1073742036 || localOnly)) {
var volume = this.getShapeProperty (25, "volume");
if (J.util.Escape.isAD (volume)) {
var vs = volume;
var v = 0;
for (var i = 0; i < vs.length; i++) v += Math.abs (vs[i]);

volume = Float.$valueOf (v);
}var nsets = (this.getShapeProperty (25, "nSets")).intValue ();
if (colorDensity || displayType != 1276117510) {
this.showString ((nsets == 0 ? "" : nsets + " contacts with ") + "net volume " + volume + " A^3");
}}}, $fz.isPrivate = true, $fz));
$_M(c$, "setContactBitSets", 
function (bsA, bsB, localOnly, distance, rd, warnMultiModel) {
var withinAllModels;
var bs;
if (bsB == null) {
bsB = J.util.BSUtil.setAll (this.viewer.getAtomCount ());
J.util.BSUtil.andNot (bsB, this.viewer.getDeletedAtoms ());
bsB.andNot (bsA);
withinAllModels = false;
} else {
bs = J.util.BSUtil.copy (bsA);
bs.or (bsB);
var nModels = this.viewer.getModelBitSet (bs, false).cardinality ();
withinAllModels = (nModels > 1);
if (warnMultiModel && nModels > 1 && !this.tQuiet) this.showString (J.i18n.GT._ ("Note: More than one model is involved in this contact!"));
}if (!bsA.equals (bsB)) {
var setBfirst = (!localOnly || bsA.cardinality () < bsB.cardinality ());
if (setBfirst) {
bs = this.viewer.getAtomsWithinRadius (distance, bsA, withinAllModels, (Float.isNaN (distance) ? rd : null));
bsB.and (bs);
}if (localOnly) {
bs = this.viewer.getAtomsWithinRadius (distance, bsB, withinAllModels, (Float.isNaN (distance) ? rd : null));
bsA.and (bs);
if (!setBfirst) {
bs = this.viewer.getAtomsWithinRadius (distance, bsA, withinAllModels, (Float.isNaN (distance) ? rd : null));
bsB.and (bs);
}bs = J.util.BSUtil.copy (bsB);
bs.and (bsA);
if (bs.equals (bsA)) bsB.andNot (bsA);
 else if (bs.equals (bsB)) bsA.andNot (bsB);
}}return bsB;
}, "J.util.BS,J.util.BS,~B,~N,J.atomdata.RadiusData,~B");
$_M(c$, "lcaoCartoon", 
($fz = function () {
this.sm.loadShape (26);
if (this.tokAt (1) == 1073742001 && this.listIsosurface (26)) return;
this.setShapeProperty (26, "init", this.fullCommand);
if (this.slen == 1) {
this.setShapeProperty (26, "lcaoID", null);
return;
}var idSeen = false;
var translucency = null;
for (var i = 1; i < this.slen; i++) {
var propertyName = null;
var propertyValue = null;
switch (this.getToken (i).tok) {
case 1074790451:
case 554176565:
propertyName = this.theToken.value;
if (this.tokAt (i + 1) == 1048588) this.iToken = i + 1;
propertyValue = this.getCapSlabObject (i, true);
i = this.iToken;
break;
case 12289:
this.isosurface (26);
return;
case 528432:
var degx = 0;
var degy = 0;
var degz = 0;
switch (this.getToken (++i).tok) {
case 1112541205:
degx = this.floatParameter (++i) * 0.017453292;
break;
case 1112541206:
degy = this.floatParameter (++i) * 0.017453292;
break;
case 1112541207:
degz = this.floatParameter (++i) * 0.017453292;
break;
default:
this.error (22);
}
propertyName = "rotationAxis";
propertyValue = J.util.V3.new3 (degx, degy, degz);
break;
case 1048589:
case 1610625028:
case 3145768:
propertyName = "on";
break;
case 1048588:
case 12294:
case 3145770:
propertyName = "off";
break;
case 12291:
propertyName = "delete";
break;
case 10:
case 1048577:
propertyName = "select";
propertyValue = this.atomExpressionAt (i);
i = this.iToken;
break;
case 1766856708:
translucency = this.setColorOptions (null, i + 1, 26, -2);
if (translucency != null) this.setShapeProperty (26, "settranslucency", translucency);
i = this.iToken;
idSeen = true;
continue;
case 1073742180:
case 1073742074:
this.setMeshDisplayProperty (26, i, this.theTok);
i = this.iToken;
idSeen = true;
continue;
case 1113200651:
case 4:
propertyValue = this.parameterAsString (i).toLowerCase ();
if (propertyValue.equals ("spacefill")) propertyValue = "cpk";
propertyName = "create";
if (this.optParameterAsString (i + 1).equalsIgnoreCase ("molecular")) {
i++;
propertyName = "molecular";
}break;
case 135280132:
if (this.tokAt (i + 1) == 10 || this.tokAt (i + 1) == 1048577) {
propertyName = "select";
propertyValue = this.atomExpressionAt (i + 1);
i = this.iToken;
} else {
propertyName = "selectType";
propertyValue = this.parameterAsString (++i);
if (propertyValue.equals ("spacefill")) propertyValue = "cpk";
}break;
case 1073742138:
propertyName = "scale";
propertyValue = Float.$valueOf (this.floatParameter (++i));
break;
case 1073742004:
case 1073742006:
propertyName = "lonePair";
break;
case 1073742112:
case 1073742111:
propertyName = "radical";
break;
case 1073742029:
propertyName = "molecular";
break;
case 1073741904:
propertyValue = this.parameterAsString (++i);
propertyName = "create";
if (this.optParameterAsString (i + 1).equalsIgnoreCase ("molecular")) {
i++;
propertyName = "molecular";
}break;
case 1074790550:
propertyValue = this.getShapeNameParameter (++i);
i = this.iToken;
if (idSeen) this.error (22);
propertyName = "lcaoID";
break;
default:
if (this.theTok == 269484209 || J.script.T.tokAttr (this.theTok, 1073741824)) {
if (this.theTok != 269484209) propertyValue = this.parameterAsString (i);
if (idSeen) this.error (22);
propertyName = "lcaoID";
break;
}break;
}
if (this.theTok != 12291) idSeen = true;
if (propertyName == null) this.error (22);
this.setShapeProperty (26, propertyName, propertyValue);
}
this.setShapeProperty (26, "clear", null);
}, $fz.isPrivate = true, $fz));
$_M(c$, "getCapSlabObject", 
($fz = function (i, isLcaoCartoon) {
if (i < 0) {
return J.util.MeshSurface.getSlabWithinRange (i, 0);
}var data = null;
var tok0 = this.tokAt (i);
var isSlab = (tok0 == 554176565);
var tok = this.tokAt (i + 1);
var plane = null;
var pts = null;
var d;
var d2;
var bs = null;
var slabColix = null;
var slabMeshType = null;
if (tok == 1073742180) {
var slabTranslucency = (this.isFloatParameter (++i + 1) ? this.floatParameter (++i) : 0.5);
if (this.isColorParam (i + 1)) {
slabColix = Short.$valueOf (J.util.C.getColixTranslucent3 (J.util.C.getColix (this.getArgbParam (i + 1)), slabTranslucency != 0, slabTranslucency));
i = this.iToken;
} else {
slabColix = Short.$valueOf (J.util.C.getColixTranslucent3 (1, slabTranslucency != 0, slabTranslucency));
}switch (tok = this.tokAt (i + 1)) {
case 1073742018:
case 1073741938:
slabMeshType = Integer.$valueOf (tok);
tok = this.tokAt (++i + 1);
break;
default:
slabMeshType = Integer.$valueOf (1073741938);
break;
}
}switch (tok) {
case 10:
case 1048577:
data = this.atomExpressionAt (i + 1);
tok = 3;
this.iToken++;
break;
case 1048588:
this.iToken = i + 1;
return Integer.$valueOf (-2147483648);
case 1048587:
this.iToken = i + 1;
break;
case 1048583:
i++;
data = [Float.$valueOf (1), this.parameterAsString (++i)];
tok = 1073742018;
break;
case 135266324:
i++;
if (this.tokAt (++i) == 1073742114) {
d = this.floatParameter (++i);
d2 = this.floatParameter (++i);
data = [Float.$valueOf (d), Float.$valueOf (d2)];
tok = 1073742114;
} else if (this.isFloatParameter (i)) {
d = this.floatParameter (i);
if (this.isCenterParameter (++i)) {
var pt = this.centerParameter (i);
if (this.chk || !(Clazz.instanceOf (this.expressionResult, J.util.BS))) {
pts = [pt];
} else {
var atoms = this.viewer.modelSet.atoms;
bs = this.expressionResult;
pts =  new Array (bs.cardinality ());
for (var k = 0, j = bs.nextSetBit (0); j >= 0; j = bs.nextSetBit (j + 1), k++) pts[k] = atoms[j];

}} else {
pts = this.getPointArray (i, -1);
}if (pts.length == 0) {
this.iToken = i;
this.error (22);
}data = [Float.$valueOf (d), pts, bs];
} else {
data = this.getPointArray (i, 4);
tok = 1679429641;
}break;
case 1679429641:
this.iToken = i + 1;
data = J.util.BoxInfo.getCriticalPoints (this.viewer.getBoundBoxVertices (), null);
break;
case 1073741872:
case 1614417948:
this.iToken = i + 1;
var unitCell = this.viewer.getCurrentUnitCell ();
if (unitCell == null) {
if (tok == 1614417948) this.error (22);
} else {
pts = J.util.BoxInfo.getCriticalPoints (unitCell.getUnitCellVertices (), unitCell.getCartesianOffset ());
var iType = Clazz.floatToInt (unitCell.getUnitCellInfoType (6));
var v1 = null;
var v2 = null;
switch (iType) {
case 3:
break;
case 1:
v2 = J.util.V3.newV (pts[2]);
v2.sub (pts[0]);
v2.scale (1000);
case 2:
v1 = J.util.V3.newV (pts[1]);
v1.sub (pts[0]);
v1.scale (1000);
pts[0].sub (v1);
pts[1].scale (2000);
if (iType == 1) {
pts[0].sub (v2);
pts[2].scale (2000);
}break;
}
data = pts;
}break;
default:
if (!isLcaoCartoon && isSlab && this.isFloatParameter (i + 1)) {
d = this.floatParameter (++i);
if (!this.isFloatParameter (i + 1)) return Integer.$valueOf (Clazz.floatToInt (d));
d2 = this.floatParameter (++i);
data = [Float.$valueOf (d), Float.$valueOf (d2)];
tok = 1073742114;
break;
}plane = this.planeParameter (++i);
var off = (this.isFloatParameter (this.iToken + 1) ? this.floatParameter (++this.iToken) : NaN);
if (!Float.isNaN (off)) plane.w -= off;
data = plane;
tok = 135266319;
}
var colorData = (slabMeshType == null ? null : [slabMeshType, slabColix]);
return J.util.MeshSurface.getSlabObject (tok, data, !isSlab, colorData);
}, $fz.isPrivate = true, $fz), "~N,~B");
$_M(c$, "mo", 
($fz = function (isInitOnly) {
var offset = 2147483647;
var isNegOffset = false;
var bsModels = this.viewer.getVisibleFramesBitSet ();
var propertyList =  new J.util.JmolList ();
var i0 = 1;
if (this.tokAt (1) == 1095766028 || this.tokAt (1) == 4115) {
i0 = this.modelNumberParameter (2);
if (i0 < 0) this.error (22);
bsModels.clearAll ();
bsModels.set (i0);
i0 = 3;
}for (var iModel = bsModels.nextSetBit (0); iModel >= 0; iModel = bsModels.nextSetBit (iModel + 1)) {
this.sm.loadShape (27);
var i = i0;
if (this.tokAt (i) == 1073742001 && this.listIsosurface (27)) return true;
this.setShapeProperty (27, "init", Integer.$valueOf (iModel));
var title = null;
var moNumber = (this.getShapeProperty (27, "moNumber")).intValue ();
var linearCombination = this.getShapeProperty (27, "moLinearCombination");
if (isInitOnly) return true;
if (moNumber == 0) moNumber = 2147483647;
var propertyName = null;
var propertyValue = null;
switch (this.getToken (i).tok) {
case 1074790451:
case 554176565:
propertyName = this.theToken.value;
propertyValue = this.getCapSlabObject (i, false);
i = this.iToken;
break;
case 1073741914:
propertyName = "squareLinear";
propertyValue = Boolean.TRUE;
linearCombination = [1];
offset = moNumber = 0;
break;
case 2:
moNumber = this.intParameter (i);
linearCombination = this.moCombo (propertyList);
if (linearCombination == null && moNumber < 0) linearCombination = [-100, -moNumber];
break;
case 269484192:
switch (this.tokAt (++i)) {
case 1073741973:
case 1073742008:
break;
default:
this.error (22);
}
isNegOffset = true;
case 1073741973:
case 1073742008:
if ((offset = this.moOffset (i)) == 2147483647) this.error (22);
moNumber = 0;
linearCombination = this.moCombo (propertyList);
break;
case 1073742037:
moNumber = 1073742037;
linearCombination = this.moCombo (propertyList);
break;
case 1073742108:
moNumber = 1073742108;
linearCombination = this.moCombo (propertyList);
break;
case 1766856708:
this.setColorOptions (null, i + 1, 27, 2);
break;
case 135266319:
propertyName = "plane";
propertyValue = this.planeParameter (i + 1);
break;
case 135266320:
this.addShapeProperty (propertyList, "randomSeed", this.tokAt (i + 2) == 2 ? Integer.$valueOf (this.intParameter (i + 2)) : null);
propertyName = "monteCarloCount";
propertyValue = Integer.$valueOf (this.intParameter (i + 1));
break;
case 1073742138:
propertyName = "scale";
propertyValue = Float.$valueOf (this.floatParameter (i + 1));
break;
case 1073741910:
if (this.tokAt (i + 1) == 269484193) {
propertyName = "cutoffPositive";
propertyValue = Float.$valueOf (this.floatParameter (i + 2));
} else {
propertyName = "cutoff";
propertyValue = Float.$valueOf (this.floatParameter (i + 1));
}break;
case 536870916:
propertyName = "debug";
break;
case 1073742054:
propertyName = "plane";
break;
case 1073742104:
case 1073742122:
propertyName = "resolution";
propertyValue = Float.$valueOf (this.floatParameter (i + 1));
break;
case 1073742156:
propertyName = "squareData";
propertyValue = Boolean.TRUE;
break;
case 1073742168:
if (i + 1 < this.slen && this.tokAt (i + 1) == 4) {
propertyName = "titleFormat";
propertyValue = this.parameterAsString (i + 1);
}break;
case 1073741824:
this.error (22);
break;
default:
if (this.isArrayParameter (i)) {
linearCombination = this.floatParameterSet (i, 1, 2147483647);
if (this.tokAt (this.iToken + 1) == 1073742156) {
this.addShapeProperty (propertyList, "squareLinear", Boolean.TRUE);
this.iToken++;
}break;
}var ipt = this.iToken;
if (!this.setMeshDisplayProperty (27, 0, this.theTok)) this.error (22);
this.setShapeProperty (27, "setProperties", propertyList);
this.setMeshDisplayProperty (27, ipt, this.tokAt (ipt));
return true;
}
if (propertyName != null) this.addShapeProperty (propertyList, propertyName, propertyValue);
if (moNumber != 2147483647 || linearCombination != null) {
if (this.tokAt (this.iToken + 1) == 4) title = this.parameterAsString (++this.iToken);
this.setCursorWait (true);
this.setMoData (propertyList, moNumber, linearCombination, offset, isNegOffset, iModel, title);
this.addShapeProperty (propertyList, "finalize", null);
}if (propertyList.size () > 0) this.setShapeProperty (27, "setProperties", propertyList);
propertyList.clear ();
}
return true;
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "moCombo", 
($fz = function (propertyList) {
if (this.tokAt (this.iToken + 1) != 1073742156) return null;
this.addShapeProperty (propertyList, "squareLinear", Boolean.TRUE);
this.iToken++;
return  Clazz.newFloatArray (0, 0);
}, $fz.isPrivate = true, $fz), "J.util.JmolList");
$_M(c$, "moOffset", 
($fz = function (index) {
var isHomo = (this.getToken (index).tok == 1073741973);
var offset = (isHomo ? 0 : 1);
var tok = this.tokAt (++index);
if (tok == 2 && this.intParameter (index) < 0) offset += this.intParameter (index);
 else if (tok == 269484193) offset += this.intParameter (++index);
 else if (tok == 269484192) offset -= this.intParameter (++index);
return offset;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "setMoData", 
($fz = function (propertyList, moNumber, lc, offset, isNegOffset, modelIndex, title) {
if (this.chk) return;
if (modelIndex < 0) {
modelIndex = this.viewer.getCurrentModelIndex ();
if (modelIndex < 0) this.errorStr (30, "MO isosurfaces");
}var moData = this.viewer.getModelAuxiliaryInfoValue (modelIndex, "moData");
var mos = null;
var mo;
var f;
var nOrb = 0;
if (lc == null || lc.length < 2) {
if (lc != null && lc.length == 1) offset = 0;
if (moData == null) this.error (27);
var lastMoNumber = (moData.containsKey ("lastMoNumber") ? (moData.get ("lastMoNumber")).intValue () : 0);
var lastMoCount = (moData.containsKey ("lastMoCount") ? (moData.get ("lastMoCount")).intValue () : 1);
if (moNumber == 1073742108) moNumber = lastMoNumber - 1;
 else if (moNumber == 1073742037) moNumber = lastMoNumber + lastMoCount;
mos = (moData.get ("mos"));
nOrb = (mos == null ? 0 : mos.size ());
if (nOrb == 0) this.error (25);
if (nOrb == 1 && moNumber > 1) this.error (29);
if (offset != 2147483647) {
if (moData.containsKey ("HOMO")) {
moNumber = (moData.get ("HOMO")).intValue () + offset;
} else {
moNumber = -1;
for (var i = 0; i < nOrb; i++) {
mo = mos.get (i);
if ((f = mo.get ("occupancy")) != null) {
if (f.floatValue () < 0.5) {
moNumber = i;
break;
}continue;
} else if ((f = mo.get ("energy")) != null) {
if (f.floatValue () > 0) {
moNumber = i;
break;
}continue;
}break;
}
if (moNumber < 0) this.error (28);
moNumber += offset;
}J.util.Logger.info ("MO " + moNumber);
}if (moNumber < 1 || moNumber > nOrb) this.errorStr (26, "" + nOrb);
}moNumber = Math.abs (moNumber);
moData.put ("lastMoNumber", Integer.$valueOf (moNumber));
moData.put ("lastMoCount", Integer.$valueOf (1));
if (isNegOffset && lc == null) lc = [-100, moNumber];
if (lc != null && lc.length < 2) {
mo = mos.get (moNumber - 1);
if ((f = mo.get ("energy")) == null) {
lc = [100, moNumber];
} else {
var energy = f.floatValue ();
var bs = J.util.BS.newN (nOrb);
var n = 0;
var isAllElectrons = (lc.length == 1 && lc[0] == 1);
for (var i = 0; i < nOrb; i++) {
if ((f = mos.get (i).get ("energy")) == null) continue;
var e = f.floatValue ();
if (isAllElectrons ? e <= energy : e == energy) {
bs.set (i + 1);
n += 2;
}}
lc =  Clazz.newFloatArray (n, 0);
for (var i = 0, pt = 0; i < n; i += 2) {
lc[i] = 1;
lc[i + 1] = (pt = bs.nextSetBit (pt + 1));
}
moData.put ("lastMoNumber", Integer.$valueOf (bs.nextSetBit (0)));
moData.put ("lastMoCount", Integer.$valueOf (Clazz.doubleToInt (n / 2)));
}this.addShapeProperty (propertyList, "squareLinear", Boolean.TRUE);
}this.addShapeProperty (propertyList, "moData", moData);
if (title != null) this.addShapeProperty (propertyList, "title", title);
this.addShapeProperty (propertyList, "molecularOrbital", lc != null ? lc : Integer.$valueOf (Math.abs (moNumber)));
this.addShapeProperty (propertyList, "clear", null);
}, $fz.isPrivate = true, $fz), "J.util.JmolList,~N,~A,~N,~B,~N,~S");
$_M(c$, "initIsosurface", 
($fz = function (iShape) {
this.setShapeProperty (iShape, "init", this.fullCommand);
this.iToken = 0;
var tok1 = this.tokAt (1);
var tok2 = this.tokAt (2);
if (tok1 == 12291 || tok2 == 12291 && this.tokAt (++this.iToken) == 1048579) {
this.setShapeProperty (iShape, "delete", null);
this.iToken += 2;
if (this.slen > this.iToken) {
this.setShapeProperty (iShape, "init", this.fullCommand);
this.setShapeProperty (iShape, "thisID", "+PREVIOUS_MESH+");
}return null;
}this.iToken = 1;
if (!this.setMeshDisplayProperty (iShape, 0, tok1)) {
this.setShapeProperty (iShape, "thisID", "+PREVIOUS_MESH+");
if (iShape != 22) this.setShapeProperty (iShape, "title", [this.thisCommand]);
if (tok1 != 1074790550 && (tok2 == 269484209 || tok1 == 269484209 && this.setMeshDisplayProperty (iShape, 0, tok2))) {
var id = this.setShapeId (iShape, 1, false);
this.iToken++;
return id;
}}return null;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "getNextComment", 
($fz = function () {
var nextCommand = this.getCommand (this.pc + 1, false, true);
return (nextCommand.startsWith ("#") ? nextCommand : "");
}, $fz.isPrivate = true, $fz));
$_M(c$, "listIsosurface", 
($fz = function (iShape) {
this.checkLength23 ();
if (!this.chk) this.showString (this.getShapeProperty (iShape, "list" + (this.tokAt (2) == 0 ? "" : " " + this.getToken (2).value)));
return true;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "isosurface", 
($fz = function (iShape) {
this.sm.loadShape (iShape);
if (this.tokAt (1) == 1073742001 && this.listIsosurface (iShape)) return;
var iptDisplayProperty = 0;
var isIsosurface = (iShape == 24);
var isPmesh = (iShape == 28);
var isPlot3d = (iShape == 29);
var isLcaoCartoon = (iShape == 26);
var surfaceObjectSeen = false;
var planeSeen = false;
var isMapped = false;
var isBicolor = false;
var isPhased = false;
var doCalcArea = false;
var doCalcVolume = false;
var isCavity = false;
var haveRadius = false;
var toCache = false;
var isFxy = false;
var haveSlab = false;
var haveIntersection = false;
var data = null;
var cmd = null;
var thisSetNumber = -1;
var nFiles = 0;
var nX;
var nY;
var nZ;
var ptX;
var ptY;
var sigma = NaN;
var cutoff = NaN;
var ptWithin = 0;
var smoothing = null;
var smoothingPower = 2147483647;
var bs = null;
var bsSelect = null;
var bsIgnore = null;
var sbCommand =  new J.util.SB ();
var pt;
var plane = null;
var lattice = null;
var pts;
var str = null;
var modelIndex = (this.chk ? 0 : -2147483648);
this.setCursorWait (true);
var idSeen = (this.initIsosurface (iShape) != null);
var isWild = (idSeen && this.getShapeProperty (iShape, "ID") == null);
var isColorSchemeTranslucent = false;
var isInline;
var onlyOneModel = null;
var translucency = null;
var colorScheme = null;
var mepOrMlp = null;
var discreteColixes = null;
var propertyList =  new J.util.JmolList ();
var defaultMesh = false;
if (isPmesh || isPlot3d) this.addShapeProperty (propertyList, "fileType", "Pmesh");
for (var i = this.iToken; i < this.slen; ++i) {
var propertyName = null;
var propertyValue = null;
this.getToken (i);
if (this.theTok == 1073741824) str = this.parameterAsString (i);
switch (this.theTok) {
case 603979871:
smoothing = (this.getToken (++i).tok == 1048589 ? Boolean.TRUE : this.theTok == 1048588 ? Boolean.FALSE : null);
if (smoothing == null) this.error (22);
continue;
case 553648149:
smoothingPower = this.intParameter (++i);
continue;
case 4128:
propertyName = "moveIsosurface";
if (this.tokAt (++i) != 12) this.error (22);
propertyValue = this.getToken (i++).value;
break;
case 1073742066:
propertyName = "offset";
propertyValue = this.centerParameter (++i);
i = this.iToken;
break;
case 528432:
propertyName = "rotate";
propertyValue = (this.tokAt (this.iToken = ++i) == 1048587 ? null : this.getPoint4f (i));
i = this.iToken;
break;
case 1610612740:
propertyName = "scale3d";
propertyValue = Float.$valueOf (this.floatParameter (++i));
break;
case 1073742090:
sbCommand.append (" periodic");
propertyName = "periodic";
break;
case 1073742078:
case 266298:
case 135266320:
propertyName = this.theToken.value.toString ();
sbCommand.append (" ").appendO (this.theToken.value);
propertyValue = this.centerParameter (++i);
sbCommand.append (" ").append (J.util.Escape.eP (propertyValue));
i = this.iToken;
break;
case 1679429641:
if (this.fullCommand.indexOf ("# BBOX=") >= 0) {
var bbox = J.util.TextFormat.split (J.util.Parser.getQuotedAttribute (this.fullCommand, "# BBOX"), ',');
pts = [J.util.Escape.uP (bbox[0]), J.util.Escape.uP (bbox[1])];
} else if (this.isCenterParameter (i + 1)) {
pts = [this.getPoint3f (i + 1, true), this.getPoint3f (this.iToken + 1, true)];
i = this.iToken;
} else {
pts = this.viewer.getBoundBoxVertices ();
}sbCommand.append (" boundBox " + J.util.Escape.eP (pts[0]) + " " + J.util.Escape.eP (pts[pts.length - 1]));
propertyName = "boundingBox";
propertyValue = pts;
break;
case 135188:
isPmesh = true;
sbCommand.append (" pmesh");
propertyName = "fileType";
propertyValue = "Pmesh";
break;
case 135267842:
bsSelect = this.atomExpressionAt (++i);
if (this.chk) {
bs =  new J.util.BS ();
} else if (this.tokAt (this.iToken + 1) == 1048577 || this.tokAt (this.iToken + 1) == 10) {
bs = this.atomExpressionAt (++this.iToken);
bs.and (this.viewer.getAtomsWithinRadius (5.0, bsSelect, false, null));
} else {
bs = this.viewer.getAtomsWithinRadius (5.0, bsSelect, true, null);
bs.andNot (this.viewer.getAtomBits (1095761934, bsSelect));
}bs.andNot (bsSelect);
sbCommand.append (" intersection ").append (J.util.Escape.eBS (bsSelect)).append (" ").append (J.util.Escape.eBS (bs));
i = this.iToken;
if (this.tokAt (i + 1) == 135368713) {
i++;
var f = this.getToken (++i).value;
sbCommand.append (" function ").append (J.util.Escape.eS (f));
if (!this.chk) this.addShapeProperty (propertyList, "func", (f.equals ("a+b") || f.equals ("a-b") ? f : this.createFunction ("__iso__", "a,b", f)));
} else {
haveIntersection = true;
}propertyName = "intersection";
propertyValue = [bsSelect, bs];
break;
case 1610625028:
case 135266324:
var isDisplay = (this.theTok == 1610625028);
if (isDisplay) {
sbCommand.append (" display");
iptDisplayProperty = i;
var tok = this.tokAt (i + 1);
if (tok == 0) continue;
i++;
this.addShapeProperty (propertyList, "token", Integer.$valueOf (1048589));
if (tok == 10 || tok == 1048579) {
propertyName = "bsDisplay";
if (tok == 1048579) {
sbCommand.append (" all");
} else {
propertyValue = this.st[i].value;
sbCommand.append (" ").append (J.util.Escape.eBS (propertyValue));
}this.checkLast (i);
break;
} else if (tok != 135266324) {
this.iToken = i;
this.error (22);
}} else {
ptWithin = i;
}var distance;
var ptc = null;
bs = null;
var havePt = false;
if (this.tokAt (i + 1) == 1048577) {
distance = this.floatParameter (i + 3);
if (this.isPoint3f (i + 4)) {
ptc = this.centerParameter (i + 4);
havePt = true;
this.iToken = this.iToken + 2;
} else if (this.isPoint3f (i + 5)) {
ptc = this.centerParameter (i + 5);
havePt = true;
this.iToken = this.iToken + 2;
} else {
bs = this.atomExpression (this.st, i + 5, this.slen, true, false, false, true);
if (bs == null) this.error (22);
}} else {
distance = this.floatParameter (++i);
ptc = this.centerParameter (++i);
}if (isDisplay) this.checkLast (this.iToken);
i = this.iToken;
if (this.fullCommand.indexOf ("# WITHIN=") >= 0) bs = J.util.Escape.uB (J.util.Parser.getQuotedAttribute (this.fullCommand, "# WITHIN"));
 else if (!havePt) bs = (Clazz.instanceOf (this.expressionResult, J.util.BS) ? this.expressionResult : null);
if (!this.chk) {
if (bs != null && modelIndex >= 0) {
bs.and (this.viewer.getModelUndeletedAtomsBitSet (modelIndex));
}if (ptc == null) ptc = this.viewer.getAtomSetCenter (bs);
this.getWithinDistanceVector (propertyList, distance, ptc, bs, isDisplay);
sbCommand.append (" within ").appendF (distance).append (" ").append (bs == null ? J.util.Escape.eP (ptc) : J.util.Escape.eBS (bs));
}continue;
case 1073742083:
propertyName = "parameters";
var fparams = this.floatParameterSet (++i, 1, 10);
i = this.iToken;
propertyValue = fparams;
sbCommand.append (" parameters ").append (J.util.Escape.eAF (fparams));
break;
case 1716520973:
case 1073742190:
onlyOneModel = this.theToken.value;
var isVariable = (this.theTok == 1073742190);
var tokProperty = this.tokAt (i + 1);
if (mepOrMlp == null) {
if (!surfaceObjectSeen && !isMapped && !planeSeen) {
this.addShapeProperty (propertyList, "sasurface", Float.$valueOf (0));
sbCommand.append (" vdw");
surfaceObjectSeen = true;
}propertyName = "property";
if (smoothing == null) {
var allowSmoothing = true;
switch (tokProperty) {
case 1095761923:
case 1095763969:
case 1095763976:
case 1766856708:
case 1095761937:
allowSmoothing = false;
break;
}
smoothing = (allowSmoothing && this.viewer.getIsosurfacePropertySmoothing (false) == 1 ? Boolean.TRUE : Boolean.FALSE);
}this.addShapeProperty (propertyList, "propertySmoothing", smoothing);
sbCommand.append (" isosurfacePropertySmoothing " + smoothing);
if (smoothing === Boolean.TRUE) {
if (smoothingPower == 2147483647) smoothingPower = this.viewer.getIsosurfacePropertySmoothing (true);
this.addShapeProperty (propertyList, "propertySmoothingPower", Integer.$valueOf (smoothingPower));
sbCommand.append (" isosurfacePropertySmoothingPower " + smoothingPower);
}if (this.viewer.global.rangeSelected) this.addShapeProperty (propertyList, "rangeSelected", Boolean.TRUE);
} else {
propertyName = mepOrMlp;
}str = this.parameterAsString (i);
sbCommand.append (" ").append (str);
if (str.toLowerCase ().indexOf ("property_") == 0) {
data =  Clazz.newFloatArray (this.viewer.getAtomCount (), 0);
if (this.chk) continue;
data = this.viewer.getDataFloat (str);
if (data == null) this.error (22);
this.addShapeProperty (propertyList, propertyName, data);
continue;
}var atomCount = this.viewer.getAtomCount ();
data =  Clazz.newFloatArray (atomCount, 0);
if (isVariable) {
var vname = this.parameterAsString (++i);
if (vname.length == 0) {
data = this.floatParameterSet (i, atomCount, atomCount);
} else {
data =  Clazz.newFloatArray (atomCount, 0);
if (!this.chk) J.util.Parser.parseStringInfestedFloatArray ("" + this.getParameter (vname, 4), null, data);
}if (!this.chk) sbCommand.append (" \"\" ").append (J.util.Escape.eAF (data));
} else {
this.getToken (++i);
if (!this.chk) {
sbCommand.append (" " + this.theToken.value);
var atoms = this.viewer.modelSet.atoms;
this.viewer.autoCalculate (tokProperty);
if (tokProperty != 1766856708) for (var iAtom = atomCount; --iAtom >= 0; ) data[iAtom] = J.modelset.Atom.atomPropertyFloat (this.viewer, atoms[iAtom], tokProperty);

}if (tokProperty == 1766856708) colorScheme = "inherit";
if (this.tokAt (i + 1) == 135266324) {
var d = this.floatParameter (i = i + 2);
sbCommand.append (" within " + d);
this.addShapeProperty (propertyList, "propertyDistanceMax", Float.$valueOf (d));
}}propertyValue = data;
break;
case 1095766028:
if (surfaceObjectSeen) this.error (22);
modelIndex = this.modelNumberParameter (++i);
sbCommand.append (" model " + modelIndex);
if (modelIndex < 0) {
propertyName = "fixed";
propertyValue = Boolean.TRUE;
break;
}propertyName = "modelIndex";
propertyValue = Integer.$valueOf (modelIndex);
break;
case 135280132:
propertyName = "select";
var bs1 = this.atomExpressionAt (++i);
propertyValue = bs1;
i = this.iToken;
var isOnly = (this.tokAt (i + 1) == 1073742072);
if (isOnly) {
i++;
var bs2 = J.util.BSUtil.copy (bs1);
J.util.BSUtil.invertInPlace (bs2, this.viewer.getAtomCount ());
this.addShapeProperty (propertyList, "ignore", bs2);
sbCommand.append (" ignore ").append (J.util.Escape.eBS (bs2));
}if (surfaceObjectSeen || isMapped) {
sbCommand.append (" select " + J.util.Escape.eBS (bs1));
} else {
bsSelect = propertyValue;
if (modelIndex < 0 && bsSelect.nextSetBit (0) >= 0) modelIndex = this.viewer.getAtomModelIndex (bsSelect.nextSetBit (0));
}break;
case 1085443:
thisSetNumber = this.intParameter (++i);
break;
case 12289:
propertyName = "center";
propertyValue = this.centerParameter (++i);
sbCommand.append (" center " + J.util.Escape.eP (propertyValue));
i = this.iToken;
break;
case 1073742147:
case 1766856708:
var color;
idSeen = true;
var isSign = (this.theTok == 1073742147);
if (isSign) {
sbCommand.append (" sign");
this.addShapeProperty (propertyList, "sign", Boolean.TRUE);
} else {
if (this.tokAt (i + 1) == 1073741914) {
i++;
propertyName = "colorDensity";
sbCommand.append (" color density");
break;
}if (this.getToken (i + 1).tok == 4) {
colorScheme = this.parameterAsString (++i);
if (colorScheme.indexOf (" ") > 0) {
discreteColixes = J.util.C.getColixArray (colorScheme);
if (discreteColixes == null) this.error (4);
}} else if (this.theTok == 1073742018) {
i++;
sbCommand.append (" color mesh");
color = this.getArgbParam (++i);
this.addShapeProperty (propertyList, "meshcolor", Integer.$valueOf (color));
sbCommand.append (" ").append (J.util.Escape.escapeColor (color));
i = this.iToken;
continue;
}if ((this.theTok = this.tokAt (i + 1)) == 1073742180 || this.theTok == 1073742074) {
sbCommand.append (" color");
translucency = this.setColorOptions (sbCommand, i + 1, 24, -2);
i = this.iToken;
continue;
}switch (this.tokAt (i + 1)) {
case 1073741826:
case 1073742114:
this.getToken (++i);
sbCommand.append (" color range");
this.addShapeProperty (propertyList, "rangeAll", null);
if (this.tokAt (i + 1) == 1048579) {
i++;
sbCommand.append (" all");
continue;
}var min = this.floatParameter (++i);
var max = this.floatParameter (++i);
this.addShapeProperty (propertyList, "red", Float.$valueOf (min));
this.addShapeProperty (propertyList, "blue", Float.$valueOf (max));
sbCommand.append (" ").appendF (min).append (" ").appendF (max);
continue;
}
if (this.isColorParam (i + 1)) {
color = this.getArgbParam (i + 1);
if (this.tokAt (i + 2) == 1074790746) {
colorScheme = this.getColorRange (i + 1);
i = this.iToken;
break;
}}sbCommand.append (" color");
}if (this.isColorParam (i + 1)) {
color = this.getArgbParam (++i);
sbCommand.append (" ").append (J.util.Escape.escapeColor (color));
i = this.iToken;
this.addShapeProperty (propertyList, "colorRGB", Integer.$valueOf (color));
idSeen = true;
if (this.isColorParam (i + 1)) {
color = this.getArgbParam (++i);
i = this.iToken;
this.addShapeProperty (propertyList, "colorRGB", Integer.$valueOf (color));
sbCommand.append (" ").append (J.util.Escape.escapeColor (color));
isBicolor = true;
} else if (isSign) {
this.error (23);
}} else if (!isSign && discreteColixes == null) {
this.error (23);
}continue;
case 135270422:
if (!isIsosurface) this.error (22);
toCache = !this.chk;
continue;
case 1229984263:
if (this.tokAt (i + 1) != 4) this.error (23);
continue;
case 1112541195:
case 1649412112:
sbCommand.append (" ").appendO (this.theToken.value);
var rd = this.encodeRadiusParameter (i, false, true);
sbCommand.append (" ").appendO (rd);
if (Float.isNaN (rd.value)) rd.value = 100;
propertyValue = rd;
propertyName = "radius";
haveRadius = true;
if (isMapped) surfaceObjectSeen = false;
i = this.iToken;
break;
case 135266319:
planeSeen = true;
propertyName = "plane";
propertyValue = this.planeParameter (++i);
i = this.iToken;
sbCommand.append (" plane ").append (J.util.Escape.eP4 (propertyValue));
break;
case 1073742138:
propertyName = "scale";
propertyValue = Float.$valueOf (this.floatParameter (++i));
sbCommand.append (" scale ").appendO (propertyValue);
break;
case 1048579:
if (idSeen) this.error (22);
propertyName = "thisID";
break;
case 1113198596:
surfaceObjectSeen = true;
++i;
try {
propertyValue = this.getPoint4f (i);
propertyName = "ellipsoid";
i = this.iToken;
sbCommand.append (" ellipsoid ").append (J.util.Escape.eP4 (propertyValue));
break;
} catch (e) {
if (Clazz.exceptionOf (e, J.script.ScriptException)) {
} else {
throw e;
}
}
try {
propertyName = "ellipsoid";
propertyValue = this.floatParameterSet (i, 6, 6);
i = this.iToken;
sbCommand.append (" ellipsoid ").append (J.util.Escape.eAF (propertyValue));
break;
} catch (e) {
if (Clazz.exceptionOf (e, J.script.ScriptException)) {
} else {
throw e;
}
}
bs = this.atomExpressionAt (i);
sbCommand.append (" ellipsoid ").append (J.util.Escape.eBS (bs));
var iAtom = bs.nextSetBit (0);
var atoms = this.viewer.modelSet.atoms;
if (iAtom >= 0) propertyValue = atoms[iAtom].getEllipsoid ();
if (propertyValue == null) return;
i = this.iToken;
propertyName = "ellipsoid";
if (!this.chk) this.addShapeProperty (propertyList, "center", this.viewer.getAtomPoint3f (iAtom));
break;
case 135267841:
planeSeen = true;
propertyName = "plane";
propertyValue = this.hklParameter (++i);
i = this.iToken;
sbCommand.append (" plane ").append (J.util.Escape.eP4 (propertyValue));
break;
case 135182:
surfaceObjectSeen = true;
var lcaoType = this.parameterAsString (++i);
this.addShapeProperty (propertyList, "lcaoType", lcaoType);
sbCommand.append (" lcaocartoon ").append (J.util.Escape.eS (lcaoType));
switch (this.getToken (++i).tok) {
case 10:
case 1048577:
propertyName = "lcaoCartoon";
bs = this.atomExpressionAt (i);
i = this.iToken;
if (this.chk) continue;
var atomIndex = bs.nextSetBit (0);
if (atomIndex < 0) this.error (14);
sbCommand.append (" ({").appendI (atomIndex).append ("})");
modelIndex = this.viewer.getAtomModelIndex (atomIndex);
this.addShapeProperty (propertyList, "modelIndex", Integer.$valueOf (modelIndex));
var axes = [ new J.util.V3 (),  new J.util.V3 (), J.util.V3.newV (this.viewer.getAtomPoint3f (atomIndex)),  new J.util.V3 ()];
if (!lcaoType.equalsIgnoreCase ("s") && this.viewer.getHybridizationAndAxes (atomIndex, axes[0], axes[1], lcaoType) == null) return;
propertyValue = axes;
break;
default:
this.error (14);
}
break;
case 1183762:
var moNumber = 2147483647;
var offset = 2147483647;
var isNegOffset = (this.tokAt (i + 1) == 269484192);
if (isNegOffset) i++;
var linearCombination = null;
switch (this.tokAt (++i)) {
case 0:
this.error (2);
break;
case 1073741914:
sbCommand.append ("mo [1] squared ");
this.addShapeProperty (propertyList, "squareLinear", Boolean.TRUE);
linearCombination = [1];
offset = moNumber = 0;
i++;
break;
case 1073741973:
case 1073742008:
offset = this.moOffset (i);
moNumber = 0;
i = this.iToken;
sbCommand.append (" mo " + (isNegOffset ? "-" : "") + "HOMO ");
if (offset > 0) sbCommand.append ("+");
if (offset != 0) sbCommand.appendI (offset);
break;
case 2:
moNumber = this.intParameter (i);
sbCommand.append (" mo ").appendI (moNumber);
break;
default:
if (this.isArrayParameter (i)) {
linearCombination = this.floatParameterSet (i, 1, 2147483647);
i = this.iToken;
}}
var squared = (this.tokAt (i + 1) == 1073742156);
if (squared) {
this.addShapeProperty (propertyList, "squareLinear", Boolean.TRUE);
sbCommand.append (" squared");
if (linearCombination == null) linearCombination =  Clazz.newFloatArray (0, 0);
} else if (this.tokAt (i + 1) == 135266320) {
++i;
var monteCarloCount = this.intParameter (++i);
var seed = (this.tokAt (i + 1) == 2 ? this.intParameter (++i) : (-System.currentTimeMillis ()) % 10000);
this.addShapeProperty (propertyList, "monteCarloCount", Integer.$valueOf (monteCarloCount));
this.addShapeProperty (propertyList, "randomSeed", Integer.$valueOf (seed));
sbCommand.append (" points ").appendI (monteCarloCount).appendC (' ').appendI (seed);
}this.setMoData (propertyList, moNumber, linearCombination, offset, isNegOffset, modelIndex, null);
surfaceObjectSeen = true;
continue;
case 1073742036:
propertyName = "nci";
sbCommand.append (" " + propertyName);
var tok = this.tokAt (i + 1);
var isPromolecular = (tok != 1229984263 && tok != 4 && tok != 1073742033);
propertyValue = Boolean.$valueOf (isPromolecular);
if (isPromolecular) surfaceObjectSeen = true;
break;
case 1073742016:
case 1073742022:
var isMep = (this.theTok == 1073742016);
propertyName = (isMep ? "mep" : "mlp");
sbCommand.append (" " + propertyName);
var fname = null;
var calcType = -1;
surfaceObjectSeen = true;
if (this.tokAt (i + 1) == 2) {
calcType = this.intParameter (++i);
sbCommand.append (" " + calcType);
this.addShapeProperty (propertyList, "mepCalcType", Integer.$valueOf (calcType));
}if (this.tokAt (i + 1) == 4) {
fname = this.stringParameter (++i);
sbCommand.append (" /*file*/" + J.util.Escape.eS (fname));
} else if (this.tokAt (i + 1) == 1716520973) {
mepOrMlp = propertyName;
continue;
}if (!this.chk) try {
data = (fname == null && isMep ? this.viewer.getPartialCharges () : this.viewer.getAtomicPotentials (isMep, bsSelect, bsIgnore, fname));
} catch (e) {
if (Clazz.exceptionOf (e, Exception)) {
} else {
throw e;
}
}
if (!this.chk && data == null) this.error (32);
propertyValue = data;
break;
case 1313866247:
doCalcVolume = !this.chk;
sbCommand.append (" volume");
break;
case 1074790550:
this.setShapeId (iShape, ++i, idSeen);
isWild = (this.getShapeProperty (iShape, "ID") == null);
i = this.iToken;
break;
case 1073741888:
if (this.tokAt (i + 1) == 1073742180) {
isColorSchemeTranslucent = true;
i++;
}colorScheme = this.parameterAsString (++i).toLowerCase ();
if (colorScheme.equals ("sets")) {
sbCommand.append (" colorScheme \"sets\"");
} else if (this.isColorParam (i)) {
colorScheme = this.getColorRange (i);
i = this.iToken;
}break;
case 1073741828:
propertyName = "addHydrogens";
propertyValue = Boolean.TRUE;
sbCommand.append (" addHydrogens");
break;
case 1073741836:
propertyName = "angstroms";
sbCommand.append (" angstroms");
break;
case 1073741838:
propertyName = "anisotropy";
propertyValue = this.getPoint3f (++i, false);
sbCommand.append (" anisotropy").append (J.util.Escape.eP (propertyValue));
i = this.iToken;
break;
case 1073741842:
doCalcArea = !this.chk;
sbCommand.append (" area");
break;
case 1073741850:
case 1073742076:
surfaceObjectSeen = true;
if (isBicolor && !isPhased) {
sbCommand.append (" phase \"_orb\"");
this.addShapeProperty (propertyList, "phase", "_orb");
}var nlmZprs =  Clazz.newFloatArray (7, 0);
nlmZprs[0] = this.intParameter (++i);
nlmZprs[1] = this.intParameter (++i);
nlmZprs[2] = this.intParameter (++i);
nlmZprs[3] = (this.isFloatParameter (i + 1) ? this.floatParameter (++i) : 6);
sbCommand.append (" atomicOrbital ").appendI (Clazz.floatToInt (nlmZprs[0])).append (" ").appendI (Clazz.floatToInt (nlmZprs[1])).append (" ").appendI (Clazz.floatToInt (nlmZprs[2])).append (" ").appendF (nlmZprs[3]);
if (this.tokAt (i + 1) == 135266320) {
i += 2;
nlmZprs[4] = this.intParameter (i);
nlmZprs[5] = (this.tokAt (i + 1) == 3 ? this.floatParameter (++i) : 0);
nlmZprs[6] = (this.tokAt (i + 1) == 2 ? this.intParameter (++i) : (-System.currentTimeMillis ()) % 10000);
sbCommand.append (" points ").appendI (Clazz.floatToInt (nlmZprs[4])).appendC (' ').appendF (nlmZprs[5]).appendC (' ').appendI (Clazz.floatToInt (nlmZprs[6]));
}propertyName = "hydrogenOrbital";
propertyValue = nlmZprs;
break;
case 1073741866:
sbCommand.append (" binary");
continue;
case 1073741868:
sbCommand.append (" blockData");
propertyName = "blockData";
propertyValue = Boolean.TRUE;
break;
case 1074790451:
case 554176565:
haveSlab = true;
propertyName = this.theToken.value;
propertyValue = this.getCapSlabObject (i, false);
i = this.iToken;
break;
case 1073741876:
if (!isIsosurface) this.error (22);
isCavity = true;
if (this.chk) continue;
var cavityRadius = (this.isFloatParameter (i + 1) ? this.floatParameter (++i) : 1.2);
var envelopeRadius = (this.isFloatParameter (i + 1) ? this.floatParameter (++i) : 10);
if (envelopeRadius > 10) this.integerOutOfRange (0, 10);
sbCommand.append (" cavity ").appendF (cavityRadius).append (" ").appendF (envelopeRadius);
this.addShapeProperty (propertyList, "envelopeRadius", Float.$valueOf (envelopeRadius));
this.addShapeProperty (propertyList, "cavityRadius", Float.$valueOf (cavityRadius));
propertyName = "cavity";
break;
case 1073741896:
case 1073741900:
propertyName = "contour";
sbCommand.append (" contour");
switch (this.tokAt (i + 1)) {
case 1073741920:
propertyValue = this.floatParameterSet (i + 2, 1, 2147483647);
sbCommand.append (" discrete ").append (J.util.Escape.eAF (propertyValue));
i = this.iToken;
break;
case 1073741981:
pt = this.getPoint3f (i + 2, false);
if (pt.z <= 0 || pt.y < pt.x) this.error (22);
if (pt.z == Clazz.floatToInt (pt.z) && pt.z > (pt.y - pt.x)) pt.z = (pt.y - pt.x) / pt.z;
propertyValue = pt;
i = this.iToken;
sbCommand.append (" increment ").append (J.util.Escape.eP (pt));
break;
default:
propertyValue = Integer.$valueOf (this.tokAt (i + 1) == 2 ? this.intParameter (++i) : 0);
sbCommand.append (" ").appendO (propertyValue);
}
break;
case 3:
case 2:
case 269484193:
case 1073741910:
sbCommand.append (" cutoff ");
if (this.theTok == 1073741910) i++;
if (this.tokAt (i) == 269484193) {
propertyName = "cutoffPositive";
propertyValue = Float.$valueOf (cutoff = this.floatParameter (++i));
sbCommand.append ("+").appendO (propertyValue);
} else if (this.isFloatParameter (i)) {
propertyName = "cutoff";
propertyValue = Float.$valueOf (cutoff = this.floatParameter (i));
sbCommand.appendO (propertyValue);
} else {
propertyName = "cutoffRange";
propertyValue = this.floatParameterSet (i, 2, 2);
this.addShapeProperty (propertyList, "cutoff", Float.$valueOf (0));
sbCommand.append (J.util.Escape.eAF (propertyValue));
i = this.iToken;
}break;
case 1073741928:
propertyName = "downsample";
propertyValue = Integer.$valueOf (this.intParameter (++i));
sbCommand.append (" downsample ").appendO (propertyValue);
break;
case 1073741930:
propertyName = "eccentricity";
propertyValue = this.getPoint4f (++i);
sbCommand.append (" eccentricity ").append (J.util.Escape.eP4 (propertyValue));
i = this.iToken;
break;
case 1074790508:
sbCommand.append (" ed");
this.setMoData (propertyList, -1, null, 0, false, modelIndex, null);
surfaceObjectSeen = true;
continue;
case 536870916:
case 1073742041:
sbCommand.append (" ").appendO (this.theToken.value);
propertyName = "debug";
propertyValue = (this.theTok == 536870916 ? Boolean.TRUE : Boolean.FALSE);
break;
case 1060869:
sbCommand.append (" fixed");
propertyName = "fixed";
propertyValue = Boolean.TRUE;
break;
case 1073741962:
sbCommand.append (" fullPlane");
propertyName = "fullPlane";
propertyValue = Boolean.TRUE;
break;
case 1073741966:
case 1073741968:
var isFxyz = (this.theTok == 1073741968);
propertyName = "" + this.theToken.value;
var vxy =  new J.util.JmolList ();
propertyValue = vxy;
isFxy = surfaceObjectSeen = true;
sbCommand.append (" ").append (propertyName);
var name = this.parameterAsString (++i);
if (name.equals ("=")) {
sbCommand.append (" =");
name = this.parameterAsString (++i);
sbCommand.append (" ").append (J.util.Escape.eS (name));
vxy.addLast (name);
if (!this.chk) this.addShapeProperty (propertyList, "func", this.createFunction ("__iso__", "x,y,z", name));
break;
}var dName = J.util.Parser.getQuotedAttribute (this.fullCommand, "# DATA" + (isFxy ? "2" : ""));
if (dName == null) dName = "inline";
 else name = dName;
var isXYZ = (name.indexOf ("data2d_") == 0);
var isXYZV = (name.indexOf ("data3d_") == 0);
isInline = name.equals ("inline");
sbCommand.append (" inline");
vxy.addLast (name);
var pt3 = this.getPoint3f (++i, false);
sbCommand.append (" ").append (J.util.Escape.eP (pt3));
vxy.addLast (pt3);
var pt4;
ptX = ++this.iToken;
vxy.addLast (pt4 = this.getPoint4f (ptX));
sbCommand.append (" ").append (J.util.Escape.eP4 (pt4));
nX = Clazz.floatToInt (pt4.x);
ptY = ++this.iToken;
vxy.addLast (pt4 = this.getPoint4f (ptY));
sbCommand.append (" ").append (J.util.Escape.eP4 (pt4));
nY = Clazz.floatToInt (pt4.x);
vxy.addLast (pt4 = this.getPoint4f (++this.iToken));
sbCommand.append (" ").append (J.util.Escape.eP4 (pt4));
nZ = Clazz.floatToInt (pt4.x);
if (nX == 0 || nY == 0 || nZ == 0) this.error (22);
if (!this.chk) {
var fdata = null;
var xyzdata = null;
if (isFxyz) {
if (isInline) {
nX = Math.abs (nX);
nY = Math.abs (nY);
nZ = Math.abs (nZ);
xyzdata = this.floatArraySetXYZ (++this.iToken, nX, nY, nZ);
} else if (isXYZV) {
xyzdata = this.viewer.getDataFloat3D (name);
} else {
xyzdata = this.viewer.functionXYZ (name, nX, nY, nZ);
}nX = Math.abs (nX);
nY = Math.abs (nY);
nZ = Math.abs (nZ);
if (xyzdata == null) {
this.iToken = ptX;
this.errorStr (53, "xyzdata is null.");
}if (xyzdata.length != nX || xyzdata[0].length != nY || xyzdata[0][0].length != nZ) {
this.iToken = ptX;
this.errorStr (53, "xyzdata[" + xyzdata.length + "][" + xyzdata[0].length + "][" + xyzdata[0][0].length + "] is not of size [" + nX + "][" + nY + "][" + nZ + "]");
}vxy.addLast (xyzdata);
sbCommand.append (" ").append (J.util.Escape.e (xyzdata));
} else {
if (isInline) {
nX = Math.abs (nX);
nY = Math.abs (nY);
fdata = this.floatArraySet (++this.iToken, nX, nY);
} else if (isXYZ) {
fdata = this.viewer.getDataFloat2D (name);
nX = (fdata == null ? 0 : fdata.length);
nY = 3;
} else {
fdata = this.viewer.functionXY (name, nX, nY);
nX = Math.abs (nX);
nY = Math.abs (nY);
}if (fdata == null) {
this.iToken = ptX;
this.errorStr (53, "fdata is null.");
}if (fdata.length != nX && !isXYZ) {
this.iToken = ptX;
this.errorStr (53, "fdata length is not correct: " + fdata.length + " " + nX + ".");
}for (var j = 0; j < nX; j++) {
if (fdata[j] == null) {
this.iToken = ptY;
this.errorStr (53, "fdata[" + j + "] is null.");
}if (fdata[j].length != nY) {
this.iToken = ptY;
this.errorStr (53, "fdata[" + j + "] is not the right length: " + fdata[j].length + " " + nY + ".");
}}
vxy.addLast (fdata);
sbCommand.append (" ").append (J.util.Escape.e (fdata));
}}i = this.iToken;
break;
case 1073741970:
propertyName = "gridPoints";
sbCommand.append (" gridPoints");
break;
case 1073741976:
propertyName = "ignore";
propertyValue = bsIgnore = this.atomExpressionAt (++i);
sbCommand.append (" ignore ").append (J.util.Escape.eBS (bsIgnore));
i = this.iToken;
break;
case 1073741984:
propertyName = "insideOut";
sbCommand.append (" insideout");
break;
case 1073741988:
case 1073741986:
case 1073742100:
sbCommand.append (" ").appendO (this.theToken.value);
propertyName = "pocket";
propertyValue = (this.theTok == 1073742100 ? Boolean.TRUE : Boolean.FALSE);
break;
case 1073742002:
propertyName = "lobe";
propertyValue = this.getPoint4f (++i);
i = this.iToken;
sbCommand.append (" lobe ").append (J.util.Escape.eP4 (propertyValue));
surfaceObjectSeen = true;
break;
case 1073742004:
case 1073742006:
propertyName = "lp";
propertyValue = this.getPoint4f (++i);
i = this.iToken;
sbCommand.append (" lp ").append (J.util.Escape.eP4 (propertyValue));
surfaceObjectSeen = true;
break;
case 1052700:
if (isMapped || this.slen == i + 1) this.error (22);
isMapped = true;
if ((isCavity || haveRadius || haveIntersection) && !surfaceObjectSeen) {
surfaceObjectSeen = true;
this.addShapeProperty (propertyList, "bsSolvent", (haveRadius || haveIntersection ?  new J.util.BS () : this.lookupIdentifierValue ("solvent")));
this.addShapeProperty (propertyList, "sasurface", Float.$valueOf (0));
}if (sbCommand.length () == 0) {
plane = this.getShapeProperty (24, "plane");
if (plane == null) {
if (this.getShapeProperty (24, "contours") != null) {
this.addShapeProperty (propertyList, "nocontour", null);
}} else {
this.addShapeProperty (propertyList, "plane", plane);
sbCommand.append ("plane ").append (J.util.Escape.eP4 (plane));
planeSeen = true;
plane = null;
}} else if (!surfaceObjectSeen && !planeSeen) {
this.error (22);
}sbCommand.append ("; isosurface map");
this.addShapeProperty (propertyList, "map", (surfaceObjectSeen ? Boolean.TRUE : Boolean.FALSE));
break;
case 1073742014:
propertyName = "maxset";
propertyValue = Integer.$valueOf (this.intParameter (++i));
sbCommand.append (" maxSet ").appendO (propertyValue);
break;
case 1073742020:
propertyName = "minset";
propertyValue = Integer.$valueOf (this.intParameter (++i));
sbCommand.append (" minSet ").appendO (propertyValue);
break;
case 1073742112:
surfaceObjectSeen = true;
propertyName = "rad";
propertyValue = this.getPoint4f (++i);
i = this.iToken;
sbCommand.append (" radical ").append (J.util.Escape.eP4 (propertyValue));
break;
case 1073742028:
propertyName = "fixed";
propertyValue = Boolean.FALSE;
sbCommand.append (" modelBased");
break;
case 1073742029:
case 1073742136:
case 1613758488:
onlyOneModel = this.theToken.value;
var radius;
if (this.theTok == 1073742029) {
propertyName = "molecular";
sbCommand.append (" molecular");
radius = 1.4;
} else {
this.addShapeProperty (propertyList, "bsSolvent", this.lookupIdentifierValue ("solvent"));
propertyName = (this.theTok == 1073742136 ? "sasurface" : "solvent");
sbCommand.append (" ").appendO (this.theToken.value);
radius = (this.isFloatParameter (i + 1) ? this.floatParameter (++i) : this.viewer.getFloat (570425394));
sbCommand.append (" ").appendF (radius);
}propertyValue = Float.$valueOf (radius);
if (this.tokAt (i + 1) == 1073741961) {
this.addShapeProperty (propertyList, "doFullMolecular", null);
sbCommand.append (" full");
i++;
}surfaceObjectSeen = true;
break;
case 1073742033:
this.addShapeProperty (propertyList, "fileType", "Mrc");
sbCommand.append (" mrc");
continue;
case 1073742064:
case 1073742062:
this.addShapeProperty (propertyList, "fileType", "Obj");
sbCommand.append (" obj");
continue;
case 1073742034:
this.addShapeProperty (propertyList, "fileType", "Msms");
sbCommand.append (" msms");
continue;
case 1073742094:
if (surfaceObjectSeen) this.error (22);
propertyName = "phase";
isPhased = true;
propertyValue = (this.tokAt (i + 1) == 4 ? this.stringParameter (++i) : "_orb");
sbCommand.append (" phase ").append (J.util.Escape.eS (propertyValue));
break;
case 1073742104:
case 1073742122:
propertyName = "resolution";
propertyValue = Float.$valueOf (this.floatParameter (++i));
sbCommand.append (" resolution ").appendO (propertyValue);
break;
case 1073742124:
propertyName = "reverseColor";
propertyValue = Boolean.TRUE;
sbCommand.append (" reversecolor");
break;
case 1073742146:
propertyName = "sigma";
propertyValue = Float.$valueOf (sigma = this.floatParameter (++i));
sbCommand.append (" sigma ").appendO (propertyValue);
break;
case 1113198597:
propertyName = "geodesic";
propertyValue = Float.$valueOf (this.floatParameter (++i));
sbCommand.append (" geosurface ").appendO (propertyValue);
surfaceObjectSeen = true;
break;
case 1073742154:
propertyName = "sphere";
propertyValue = Float.$valueOf (this.floatParameter (++i));
sbCommand.append (" sphere ").appendO (propertyValue);
surfaceObjectSeen = true;
break;
case 1073742156:
propertyName = "squareData";
propertyValue = Boolean.TRUE;
sbCommand.append (" squared");
break;
case 1073741983:
case 4:
var filename = this.parameterAsString (i);
var sType = null;
isInline = filename.equalsIgnoreCase ("inline");
if (this.tokAt (i + 1) == 4) {
sType = this.stringParameter (++i);
if (!isInline) this.addShapeProperty (propertyList, "calculationType", sType);
}var firstPass = (!surfaceObjectSeen && !planeSeen);
propertyName = (firstPass ? "readFile" : "mapColor");
if (isInline) {
if (sType == null) this.error (22);
if (isPmesh) sType = J.util.TextFormat.replaceAllCharacter (sType, "{,}|", ' ');
if (this.logMessages) J.util.Logger.debug ("pmesh inline data:\n" + sType);
propertyValue = (this.chk ? null : sType);
this.addShapeProperty (propertyList, "fileName", "");
sbCommand.append (" INLINE");
surfaceObjectSeen = true;
} else {
if (filename.startsWith ("=") && filename.length > 1) {
var info = this.viewer.setLoadFormat (filename, '_', false);
filename = info[0];
var strCutoff = (!firstPass || !Float.isNaN (cutoff) ? null : info[1]);
if (strCutoff != null && !this.chk) {
cutoff = J.script.SV.fValue (J.script.SV.getVariable (this.viewer.evaluateExpression (strCutoff)));
if (cutoff > 0) {
if (!Float.isNaN (sigma)) {
cutoff *= sigma;
sigma = NaN;
this.addShapeProperty (propertyList, "sigma", Float.$valueOf (sigma));
}this.addShapeProperty (propertyList, "cutoff", Float.$valueOf (cutoff));
sbCommand.append (" cutoff ").appendF (cutoff);
}}if (ptWithin == 0) {
onlyOneModel = "=xxxx";
if (modelIndex < 0) modelIndex = this.viewer.getCurrentModelIndex ();
bs = this.viewer.getModelUndeletedAtomsBitSet (modelIndex);
this.getWithinDistanceVector (propertyList, 2.0, null, bs, false);
sbCommand.append (" within 2.0 ").append (J.util.Escape.eBS (bs));
}if (firstPass) defaultMesh = true;
}if (firstPass && this.viewer.getParameter ("_fileType").equals ("Pdb") && Float.isNaN (sigma) && Float.isNaN (cutoff)) {
this.addShapeProperty (propertyList, "sigma", Float.$valueOf (-1));
sbCommand.append (" sigma -1.0");
}if (filename.equals ("TESTDATA") && J.script.ScriptEvaluator.testData != null) {
propertyValue = J.script.ScriptEvaluator.testData;
break;
}if (filename.equals ("TESTDATA2") && J.script.ScriptEvaluator.testData2 != null) {
propertyValue = J.script.ScriptEvaluator.testData2;
break;
}if (filename.length == 0) {
if (modelIndex < 0) modelIndex = this.viewer.getCurrentModelIndex ();
if (surfaceObjectSeen || planeSeen) propertyValue = this.viewer.getModelAuxiliaryInfoValue (modelIndex, "jmolMappedDataInfo");
if (propertyValue == null) propertyValue = this.viewer.getModelAuxiliaryInfoValue (modelIndex, "jmolSurfaceInfo");
if (propertyValue != null) {
surfaceObjectSeen = true;
break;
}filename = this.getFullPathName ();
}var fileIndex = -1;
if (this.tokAt (i + 1) == 2) this.addShapeProperty (propertyList, "fileIndex", Integer.$valueOf (fileIndex = this.intParameter (++i)));
if (!this.chk) {
var fullPathNameOrError;
var localName = null;
if (this.fullCommand.indexOf ("# FILE" + nFiles + "=") >= 0) {
filename = J.util.Parser.getQuotedAttribute (this.fullCommand, "# FILE" + nFiles);
if (this.tokAt (i + 1) == 1073741848) i += 2;
} else if (this.tokAt (i + 1) == 1073741848) {
localName = this.viewer.getFilePath (this.stringParameter (this.iToken = (i = i + 2)), false);
fullPathNameOrError = this.viewer.getFullPathNameOrError (localName);
localName = fullPathNameOrError[0];
if (this.viewer.getPathForAllFiles () !== "") {
filename = localName;
localName = null;
} else {
this.addShapeProperty (propertyList, "localName", localName);
this.viewer.setPrivateKeyForShape (iShape);
}}if (!filename.startsWith ("cache://")) {
fullPathNameOrError = this.viewer.getFullPathNameOrError (filename);
filename = fullPathNameOrError[0];
if (fullPathNameOrError[1] != null) this.errorStr (17, filename + ":" + fullPathNameOrError[1]);
}J.util.Logger.info ("reading isosurface data from " + filename);
this.addShapeProperty (propertyList, "fileName", filename);
if (localName != null) filename = localName;
sbCommand.append (" /*file*/").append (J.util.Escape.eS (filename));
}if (fileIndex >= 0) sbCommand.append (" ").appendI (fileIndex);
}if (sType != null) sbCommand.append (" ").append (J.util.Escape.eS (sType));
surfaceObjectSeen = true;
break;
case 4106:
propertyName = "connections";
switch (this.tokAt (++i)) {
case 10:
case 1048577:
propertyValue = [this.atomExpressionAt (i).nextSetBit (0)];
break;
default:
propertyValue = [Clazz.floatToInt (this.floatParameterSet (i, 1, 1)[0])];
break;
}
i = this.iToken;
break;
case 1073741999:
propertyName = "link";
sbCommand.append (" link");
break;
case 1073741994:
if (iShape != 24) this.error (22);
pt = this.getPoint3f (this.iToken + 1, false);
i = this.iToken;
if (pt.x <= 0 || pt.y <= 0 || pt.z <= 0) break;
pt.x = Clazz.floatToInt (pt.x);
pt.y = Clazz.floatToInt (pt.y);
pt.z = Clazz.floatToInt (pt.z);
sbCommand.append (" lattice ").append (J.util.Escape.eP (pt));
if (isMapped) {
propertyName = "mapLattice";
propertyValue = pt;
} else {
lattice = pt;
}break;
default:
if (this.theTok == 1073741824) {
propertyName = "thisID";
propertyValue = str;
}if (!this.setMeshDisplayProperty (iShape, 0, this.theTok)) {
if (J.script.T.tokAttr (this.theTok, 1073741824) && !idSeen) {
this.setShapeId (iShape, i, idSeen);
i = this.iToken;
break;
}this.error (22);
}if (iptDisplayProperty == 0) iptDisplayProperty = i;
i = this.slen - 1;
break;
}
idSeen = (this.theTok != 12291);
if (isWild && surfaceObjectSeen) this.error (22);
if (propertyName != null) this.addShapeProperty (propertyList, propertyName, propertyValue);
}
if (!this.chk) {
if ((isCavity || haveRadius) && !surfaceObjectSeen) {
surfaceObjectSeen = true;
this.addShapeProperty (propertyList, "bsSolvent", (haveRadius ?  new J.util.BS () : this.lookupIdentifierValue ("solvent")));
this.addShapeProperty (propertyList, "sasurface", Float.$valueOf (0));
}if (planeSeen && !surfaceObjectSeen && !isMapped) {
this.addShapeProperty (propertyList, "nomap", Float.$valueOf (0));
surfaceObjectSeen = true;
}if (thisSetNumber >= 0) this.addShapeProperty (propertyList, "getSurfaceSets", Integer.$valueOf (thisSetNumber - 1));
if (discreteColixes != null) {
this.addShapeProperty (propertyList, "colorDiscrete", discreteColixes);
} else if ("sets".equals (colorScheme)) {
this.addShapeProperty (propertyList, "setColorScheme", null);
} else if (colorScheme != null) {
var ce = this.viewer.getColorEncoder (colorScheme);
if (ce != null) {
ce.isTranslucent = isColorSchemeTranslucent;
ce.hi = 3.4028235E38;
this.addShapeProperty (propertyList, "remapColor", ce);
}}if (surfaceObjectSeen && !isLcaoCartoon && sbCommand.indexOf (";") != 0) {
propertyList.add (0, ["newObject", null]);
var needSelect = (bsSelect == null);
if (needSelect) bsSelect = J.util.BSUtil.copy (this.viewer.getSelectionSet (false));
if (modelIndex < 0) modelIndex = this.viewer.getCurrentModelIndex ();
bsSelect.and (this.viewer.getModelUndeletedAtomsBitSet (modelIndex));
if (onlyOneModel != null) {
var bsModels = this.viewer.getModelBitSet (bsSelect, false);
if (bsModels.cardinality () != 1) this.errorStr (30, "ISOSURFACE " + onlyOneModel);
if (needSelect) {
propertyList.add (0, ["select", bsSelect]);
if (sbCommand.indexOf ("; isosurface map") == 0) {
sbCommand =  new J.util.SB ().append ("; isosurface map select ").append (J.util.Escape.eBS (bsSelect)).append (sbCommand.substring (16));
}}}}if (haveIntersection && !haveSlab) {
if (!surfaceObjectSeen) this.addShapeProperty (propertyList, "sasurface", Float.$valueOf (0));
if (!isMapped) {
this.addShapeProperty (propertyList, "map", Boolean.TRUE);
this.addShapeProperty (propertyList, "select", bs);
this.addShapeProperty (propertyList, "sasurface", Float.$valueOf (0));
}this.addShapeProperty (propertyList, "slab", this.getCapSlabObject (-100, false));
}this.setShapeProperty (iShape, "setProperties", propertyList);
if (defaultMesh) {
this.setShapeProperty (iShape, "token", Integer.$valueOf (1073742018));
this.setShapeProperty (iShape, "token", Integer.$valueOf (1073742046));
this.setShapeProperty (iShape, "token", Integer.$valueOf (1073741960));
sbCommand.append (" mesh nofill frontOnly");
}}if (lattice != null) this.setShapeProperty (24, "lattice", lattice);
if (iptDisplayProperty > 0) {
if (!this.setMeshDisplayProperty (iShape, iptDisplayProperty, 0)) this.error (22);
}if (this.chk) return;
var area = null;
var volume = null;
if (doCalcArea) {
area = this.getShapeProperty (iShape, "area");
if (Clazz.instanceOf (area, Float)) this.viewer.setFloatProperty ("isosurfaceArea", (area).floatValue ());
 else this.viewer.setUserVariable ("isosurfaceArea", J.script.SV.getVariableAD (area));
}if (doCalcVolume) {
volume = (doCalcVolume ? this.getShapeProperty (iShape, "volume") : null);
if (Clazz.instanceOf (volume, Float)) this.viewer.setFloatProperty ("isosurfaceVolume", (volume).floatValue ());
 else this.viewer.setUserVariable ("isosurfaceVolume", J.script.SV.getVariableAD (volume));
}if (!isLcaoCartoon) {
var s = null;
if (isMapped && !surfaceObjectSeen) {
this.setShapeProperty (iShape, "finalize", sbCommand.toString ());
} else if (surfaceObjectSeen) {
cmd = sbCommand.toString ();
this.setShapeProperty (iShape, "finalize", (cmd.indexOf ("; isosurface map") == 0 ? "" : " select " + J.util.Escape.eBS (bsSelect) + " ") + cmd);
s = this.getShapeProperty (iShape, "ID");
if (s != null && !this.tQuiet) {
cutoff = (this.getShapeProperty (iShape, "cutoff")).floatValue ();
if (Float.isNaN (cutoff) && !Float.isNaN (sigma)) {
J.util.Logger.error ("sigma not supported");
}s += " created";
if (isIsosurface) s += " with cutoff=" + cutoff;
var minMax = this.getShapeProperty (iShape, "minMaxInfo");
if (minMax[0] != 3.4028235E38) s += " min=" + minMax[0] + " max=" + minMax[1];
s += "; " + J.viewer.JC.shapeClassBases[iShape].toLowerCase () + " count: " + this.getShapeProperty (iShape, "count");
s += this.getIsosurfaceDataRange (iShape, "\n");
}}var sarea;
var svol;
if (doCalcArea || doCalcVolume) {
sarea = (doCalcArea ? "isosurfaceArea = " + (Clazz.instanceOf (area, Float) ? "" + area : J.util.Escape.eAD (area)) : null);
svol = (doCalcVolume ? "isosurfaceVolume = " + (Clazz.instanceOf (volume, Float) ? "" + volume : J.util.Escape.eAD (volume)) : null);
if (s == null) {
if (doCalcArea) this.showString (sarea);
if (doCalcVolume) this.showString (svol);
} else {
if (doCalcArea) s += "\n" + sarea;
if (doCalcVolume) s += "\n" + svol;
}}if (s != null) this.showString (s);
}if (translucency != null) this.setShapeProperty (iShape, "translucency", translucency);
this.setShapeProperty (iShape, "clear", null);
if (toCache) {
var id = this.getShapeProperty (iShape, "ID");
this.viewer.cachePut ("cache://isosurface_" + id, this.getShapeProperty (iShape, "jvxlDataXml"));
this.runScript ("isosurface ID \"" + id + "\" delete;isosurface ID \"" + id + "\"" + (modelIndex >= 0 ? " model " + modelIndex : "") + " \"cache://isosurface_" + this.getShapeProperty (iShape, "ID") + "\"");
}}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "setColorOptions", 
($fz = function (sb, index, iShape, nAllowed) {
this.getToken (index);
var translucency = "opaque";
if (this.theTok == 1073742180) {
translucency = "translucent";
if (nAllowed < 0) {
var value = (this.isFloatParameter (index + 1) ? this.floatParameter (++index) : 3.4028235E38);
this.setShapeTranslucency (iShape, null, "translucent", value, null);
if (sb != null) {
sb.append (" translucent");
if (value != 3.4028235E38) sb.append (" ").appendF (value);
}} else {
this.setMeshDisplayProperty (iShape, index, this.theTok);
}} else if (this.theTok == 1073742074) {
if (nAllowed >= 0) this.setMeshDisplayProperty (iShape, index, this.theTok);
} else {
this.iToken--;
}nAllowed = Math.abs (nAllowed);
for (var i = 0; i < nAllowed; i++) {
if (this.isColorParam (this.iToken + 1)) {
var color = this.getArgbParam (++this.iToken);
this.setShapeProperty (iShape, "colorRGB", Integer.$valueOf (color));
if (sb != null) sb.append (" ").append (J.util.Escape.escapeColor (color));
} else if (this.iToken < index) {
this.error (22);
} else {
break;
}}
return translucency;
}, $fz.isPrivate = true, $fz), "J.util.SB,~N,~N,~N");
$_M(c$, "getColorRange", 
($fz = function (i) {
var color1 = this.getArgbParam (i);
if (this.tokAt (++this.iToken) != 1074790746) this.error (22);
var color2 = this.getArgbParam (++this.iToken);
var nColors = (this.tokAt (this.iToken + 1) == 2 ? this.intParameter (++this.iToken) : 0);
return J.util.ColorEncoder.getColorSchemeList (J.util.ColorEncoder.getPaletteAtoB (color1, color2, nColors));
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "getIsosurfaceDataRange", 
($fz = function (iShape, sep) {
var dataRange = this.getShapeProperty (iShape, "dataRange");
return (dataRange != null && dataRange[0] != 3.4028235E38 && dataRange[0] != dataRange[1] ? sep + "isosurface" + " full data range " + dataRange[0] + " to " + dataRange[1] + " with color scheme spanning " + dataRange[2] + " to " + dataRange[3] : "");
}, $fz.isPrivate = true, $fz), "~N,~S");
$_M(c$, "getWithinDistanceVector", 
($fz = function (propertyList, distance, ptc, bs, isShow) {
var v =  new J.util.JmolList ();
var pts =  new Array (2);
if (bs == null) {
var pt1 = J.util.P3.new3 (distance, distance, distance);
var pt0 = J.util.P3.newP (ptc);
pt0.sub (pt1);
pt1.add (ptc);
pts[0] = pt0;
pts[1] = pt1;
v.addLast (ptc);
} else {
var bbox = this.viewer.getBoxInfo (bs, -Math.abs (distance));
pts[0] = bbox.getBboxVertices ()[0];
pts[1] = bbox.getBboxVertices ()[7];
if (bs.cardinality () == 1) v.addLast (this.viewer.getAtomPoint3f (bs.nextSetBit (0)));
}if (v.size () == 1 && !isShow) {
this.addShapeProperty (propertyList, "withinDistance", Float.$valueOf (distance));
this.addShapeProperty (propertyList, "withinPoint", v.get (0));
}this.addShapeProperty (propertyList, (isShow ? "displayWithin" : "withinPoints"), [Float.$valueOf (distance), pts, bs, v]);
}, $fz.isPrivate = true, $fz), "J.util.JmolList,~N,J.util.P3,J.util.BS,~B");
$_M(c$, "setMeshDisplayProperty", 
($fz = function (shape, i, tok) {
var propertyName = null;
var propertyValue = null;
var allowCOLOR = (shape == 25);
var checkOnly = (i == 0);
if (!checkOnly) tok = this.getToken (i).tok;
switch (tok) {
case 1766856708:
if (allowCOLOR) this.iToken++;
 else break;
case 1073742074:
case 1073742180:
if (!checkOnly) this.colorShape (shape, this.iToken, false);
return true;
case 0:
case 12291:
case 1048589:
case 1048588:
case 12294:
case 3145770:
case 1610625028:
case 3145768:
if (this.iToken == 1 && shape >= 0 && this.tokAt (2) == 0) this.setShapeProperty (shape, "thisID", null);
if (tok == 0) return (this.iToken == 1);
if (checkOnly) return true;
switch (tok) {
case 12291:
this.setShapeProperty (shape, "delete", null);
return true;
case 3145770:
case 12294:
tok = 1048588;
break;
case 3145768:
tok = 1048589;
break;
case 1610625028:
if (i + 1 == this.slen) tok = 1048589;
break;
}
case 1073741958:
case 1073741862:
case 1073741964:
case 1073741898:
case 1073742039:
case 1113198595:
case 1073742042:
case 1073742018:
case 1073742052:
case 1073741938:
case 1073742046:
case 1073742182:
case 1073742060:
case 1073741960:
case 1073742058:
propertyName = "token";
propertyValue = Integer.$valueOf (tok);
break;
}
if (propertyName == null) return false;
if (checkOnly) return true;
this.setShapeProperty (shape, propertyName, propertyValue);
if ((this.tokAt (this.iToken + 1)) != 0) {
if (!this.setMeshDisplayProperty (shape, ++this.iToken, 0)) --this.iToken;
}return true;
}, $fz.isPrivate = true, $fz), "~N,~N,~N");
$_M(c$, "bind", 
($fz = function () {
var mouseAction = this.stringParameter (1);
var name = this.parameterAsString (2);
var range1 = null;
var range2 = null;
this.checkLength (3);
if (!this.chk) this.viewer.bindAction (mouseAction, name, range1, range2);
}, $fz.isPrivate = true, $fz));
$_M(c$, "unbind", 
($fz = function () {
if (this.slen != 1) this.checkLength23 ();
var mouseAction = this.optParameterAsString (1);
var name = this.optParameterAsString (2);
if (mouseAction.length == 0 || this.tokAt (1) == 1048579) mouseAction = null;
if (name.length == 0 || this.tokAt (2) == 1048579) name = null;
if (name == null && mouseAction != null && J.viewer.ActionManager.getActionFromName (mouseAction) >= 0) {
name = mouseAction;
mouseAction = null;
}if (!this.chk) this.viewer.unBindAction (mouseAction, name);
}, $fz.isPrivate = true, $fz));
$_M(c$, "undoRedoMove", 
($fz = function () {
var n = 1;
var len = 2;
switch (this.tokAt (1)) {
case 0:
len = 1;
break;
case 1048579:
n = 0;
break;
case 2:
n = this.intParameter (1);
break;
default:
this.error (22);
}
this.checkLength (len);
if (!this.chk) this.viewer.undoMoveAction (this.tokAt (0), n);
}, $fz.isPrivate = true, $fz));
$_M(c$, "getAtomsNearSurface", 
function (distance, surfaceId) {
var data = [surfaceId, null, null];
if (this.chk) return  new J.util.BS ();
if (this.getShapePropertyData (24, "getVertices", data)) return this.viewer.getAtomsNearPts (distance, data[1], data[2]);
data[1] = Integer.$valueOf (0);
data[2] = Integer.$valueOf (-1);
if (this.getShapePropertyData (22, "getCenter", data)) return this.viewer.getAtomsNearPt (distance, data[2]);
return  new J.util.BS ();
}, "~N,~S");
c$.getFloatEncodedInt = $_M(c$, "getFloatEncodedInt", 
function (strDecimal) {
var pt = strDecimal.indexOf (".");
if (pt < 1 || strDecimal.charAt (0) == '-' || strDecimal.endsWith (".") || strDecimal.contains (".0")) return 2147483647;
var i = 0;
var j = 0;
if (pt > 0) {
try {
i = Integer.parseInt (strDecimal.substring (0, pt));
if (i < 0) i = -i;
} catch (e) {
if (Clazz.exceptionOf (e, NumberFormatException)) {
i = -1;
} else {
throw e;
}
}
}if (pt < strDecimal.length - 1) try {
j = Integer.parseInt (strDecimal.substring (pt + 1));
} catch (e) {
if (Clazz.exceptionOf (e, NumberFormatException)) {
} else {
throw e;
}
}
i = i * 1000000 + j;
return (i < 0 ? 2147483647 : i);
}, "~S");
c$.getPartialBondOrderFromFloatEncodedInt = $_M(c$, "getPartialBondOrderFromFloatEncodedInt", 
function (bondOrderInteger) {
return (((Clazz.doubleToInt (bondOrderInteger / 1000000)) % 6) << 5) + ((bondOrderInteger % 1000000) & 0x1F);
}, "~N");
c$.getBondOrderFromString = $_M(c$, "getBondOrderFromString", 
function (s) {
return (s.indexOf (' ') < 0 ? J.util.JmolEdge.getBondOrderFromString (s) : s.toLowerCase ().indexOf ("partial ") == 0 ? J.script.ScriptEvaluator.getPartialBondOrderFromString (s.substring (8).trim ()) : 131071);
}, "~S");
c$.getPartialBondOrderFromString = $_M(c$, "getPartialBondOrderFromString", 
($fz = function (s) {
return J.script.ScriptEvaluator.getPartialBondOrderFromFloatEncodedInt (J.script.ScriptEvaluator.getFloatEncodedInt (s));
}, $fz.isPrivate = true, $fz), "~S");
Clazz.overrideMethod (c$, "addHydrogensInline", 
function (bsAtoms, vConnections, pts) {
var modelIndex = this.viewer.getAtomModelIndex (bsAtoms.nextSetBit (0));
if (modelIndex != this.viewer.modelSet.modelCount - 1) return  new J.util.BS ();
var bsA = this.viewer.getModelUndeletedAtomsBitSet (modelIndex);
this.viewer.setAppendNew (false);
var atomIndex = this.viewer.modelSet.getAtomCount ();
var atomno = this.viewer.modelSet.getAtomCountInModel (modelIndex);
var sbConnect =  new J.util.SB ();
for (var i = 0; i < vConnections.size (); i++) {
var a = vConnections.get (i);
sbConnect.append (";  connect 0 100 ").append ("({" + (atomIndex++) + "}) ").append ("({" + a.index + "}) group;");
}
var sb =  new J.util.SB ();
sb.appendI (pts.length).append ("\n").append ("Viewer.AddHydrogens").append ("#noautobond").append ("\n");
for (var i = 0; i < pts.length; i++) sb.append ("H ").appendF (pts[i].x).append (" ").appendF (pts[i].y).append (" ").appendF (pts[i].z).append (" - - - - ").appendI (++atomno).appendC ('\n');

this.viewer.loadInlineScript (sb.toString (), '\n', true, null);
this.runScriptBuffer (sbConnect.toString (), null);
var bsB = this.viewer.getModelUndeletedAtomsBitSet (modelIndex);
bsB.andNot (bsA);
return bsB;
}, "J.util.BS,J.util.JmolList,~A");
Clazz.defineStatics (c$,
"EXPRESSION_KEY", "e_x_p_r_e_s_s_i_o_n",
"scriptLevelMax", 100,
"tryPt", 0,
"ERROR_axisExpected", 0,
"ERROR_backgroundModelError", 1,
"ERROR_badArgumentCount", 2,
"ERROR_badMillerIndices", 3,
"ERROR_badRGBColor", 4,
"ERROR_booleanExpected", 5,
"ERROR_booleanOrNumberExpected", 6,
"ERROR_booleanOrWhateverExpected", 7,
"ERROR_colorExpected", 8,
"ERROR_colorOrPaletteRequired", 9,
"ERROR_commandExpected", 10,
"ERROR_coordinateOrNameOrExpressionRequired", 11,
"ERROR_drawObjectNotDefined", 12,
"ERROR_endOfStatementUnexpected", 13,
"ERROR_expressionExpected", 14,
"ERROR_expressionOrIntegerExpected", 15,
"ERROR_filenameExpected", 16,
"ERROR_fileNotFoundException", 17,
"ERROR_incompatibleArguments", 18,
"ERROR_insufficientArguments", 19,
"ERROR_integerExpected", 20,
"ERROR_integerOutOfRange", 21,
"ERROR_invalidArgument", 22,
"ERROR_invalidParameterOrder", 23,
"ERROR_keywordExpected", 24,
"ERROR_moCoefficients", 25,
"ERROR_moIndex", 26,
"ERROR_moModelError", 27,
"ERROR_moOccupancy", 28,
"ERROR_moOnlyOne", 29,
"ERROR_multipleModelsDisplayedNotOK", 30,
"ERROR_noData", 31,
"ERROR_noPartialCharges", 32,
"ERROR_noUnitCell", 33,
"ERROR_numberExpected", 34,
"ERROR_numberMustBe", 35,
"ERROR_numberOutOfRange", 36,
"ERROR_objectNameExpected", 37,
"ERROR_planeExpected", 38,
"ERROR_propertyNameExpected", 39,
"ERROR_spaceGroupNotFound", 40,
"ERROR_stringExpected", 41,
"ERROR_stringOrIdentifierExpected", 42,
"ERROR_tooManyPoints", 43,
"ERROR_tooManyScriptLevels", 44,
"ERROR_unrecognizedAtomProperty", 45,
"ERROR_unrecognizedBondProperty", 46,
"ERROR_unrecognizedCommand", 47,
"ERROR_unrecognizedExpression", 48,
"ERROR_unrecognizedObject", 49,
"ERROR_unrecognizedParameter", 50,
"ERROR_unrecognizedParameterWarning", 51,
"ERROR_unrecognizedShowParameter", 52,
"ERROR_what", 53,
"ERROR_writeWhat", 54,
"ERROR_multipleModelsNotOK", 55,
"ERROR_cannotSet", 56,
"iProcess", 0,
"testData", null,
"testData2", null);
});
// 
//// J\api\JmolScriptEvaluator.js 
// 
Clazz.declarePackage ("J.api");
Clazz.declareInterface (J.api, "JmolScriptEvaluator");
// 
//// J\script\ScriptCompiler.js 
// 
Clazz.declarePackage ("J.script");
Clazz.load (["J.script.ScriptCompilationTokenParser", "J.util.JmolList"], "J.script.ScriptCompiler", ["java.lang.Boolean", "$.Character", "$.Float", "java.util.Hashtable", "J.api.Interface", "J.i18n.GT", "J.io.JmolBinary", "J.modelset.Bond", "$.Group", "J.script.ContextToken", "$.SV", "$.ScriptContext", "$.ScriptEvaluator", "$.ScriptFlowContext", "$.ScriptFunction", "$.T", "J.util.ArrayUtil", "$.BS", "$.Escape", "$.Logger", "$.Parser", "$.SB", "$.TextFormat", "J.viewer.Viewer"], function () {
c$ = Clazz.decorateAsClass (function () {
this.filename = null;
this.isSilent = false;
this.contextVariables = null;
this.aatokenCompiled = null;
this.lineNumbers = null;
this.lineIndices = null;
this.lnLength = 8;
this.preDefining = false;
this.isShowScriptOutput = false;
this.isCheckOnly = false;
this.haveComments = false;
this.scriptExtensions = null;
this.thisFunction = null;
this.flowContext = null;
this.ltoken = null;
this.lltoken = null;
this.vBraces = null;
this.ichBrace = 0;
this.cchToken = 0;
this.cchScript = 0;
this.nSemiSkip = 0;
this.parenCount = 0;
this.braceCount = 0;
this.setBraceCount = 0;
this.bracketCount = 0;
this.ptSemi = 0;
this.forPoint3 = 0;
this.setEqualPt = 0;
this.iBrace = 0;
this.iHaveQuotedString = false;
this.isEndOfCommand = false;
this.needRightParen = false;
this.endOfLine = false;
this.comment = null;
this.tokLastMath = 0;
this.checkImpliedScriptCmd = false;
this.vFunctionStack = null;
this.allowMissingEnd = false;
this.isShowCommand = false;
this.isComment = false;
this.isUserToken = false;
this.tokInitialPlusPlus = 0;
this.vPush = null;
this.pushCount = 0;
this.chFirst = '\0';
Clazz.instantialize (this, arguments);
}, J.script, "ScriptCompiler", J.script.ScriptCompilationTokenParser);
Clazz.prepareFields (c$, function () {
this.vPush =  new J.util.JmolList ();
});
Clazz.makeConstructor (c$, 
function (viewer) {
Clazz.superConstructor (this, J.script.ScriptCompiler, []);
this.viewer = viewer;
}, "J.viewer.Viewer");
$_M(c$, "compile", 
function (filename, script, isPredefining, isSilent, debugScript, isCheckOnly) {
this.isCheckOnly = isCheckOnly;
this.filename = filename;
this.isSilent = isSilent;
this.script = script;
this.logMessages = (!isSilent && !isPredefining && debugScript);
this.preDefining = (filename === "#predefine");
var doFull = true;
var isOK = this.compile0 (doFull);
if (!isOK) this.handleError ();
var sc =  new J.script.ScriptContext ();
isOK = (this.iBrace == 0 && this.parenCount == 0 && this.braceCount == 0 && this.bracketCount == 0);
sc.isComplete = isOK;
sc.script = script;
sc.scriptExtensions = this.scriptExtensions;
sc.errorType = this.errorType;
if (this.errorType != null) {
sc.iCommandError = this.iCommand;
this.setAaTokenCompiled ();
}sc.aatoken = this.aatokenCompiled;
sc.errorMessage = this.errorMessage;
sc.errorMessageUntranslated = (this.errorMessageUntranslated == null ? this.errorMessage : this.errorMessageUntranslated);
if (this.allowMissingEnd && sc.errorMessage != null && sc.errorMessageUntranslated.indexOf ("missing END") >= 0) sc.errorMessage = sc.errorMessageUntranslated;
sc.lineIndices = this.lineIndices;
sc.lineNumbers = this.lineNumbers;
sc.contextVariables = this.contextVariables;
return sc;
}, "~S,~S,~B,~B,~B,~B");
$_M(c$, "addContextVariable", 
($fz = function (ident) {
this.theToken = J.script.T.o (1073741824, ident);
if (this.pushCount > 0) {
var ct = this.vPush.get (this.pushCount - 1);
ct.addName (ident);
if (ct.tok != 364558) return;
}if (this.thisFunction == null) {
if (this.contextVariables == null) this.contextVariables =  new java.util.Hashtable ();
J.script.ScriptCompiler.addContextVariable (this.contextVariables, ident);
} else {
this.thisFunction.addVariable (ident, false);
}}, $fz.isPrivate = true, $fz), "~S");
c$.addContextVariable = $_M(c$, "addContextVariable", 
function (contextVariables, name) {
contextVariables.put (name, J.script.SV.newVariable (4, "").setName (name));
}, "java.util.Map,~S");
$_M(c$, "isContextVariable", 
($fz = function (ident) {
for (var i = this.vPush.size (); --i >= 0; ) {
var ct = this.vPush.get (i);
if (ct.contextVariables != null && ct.contextVariables.containsKey (ident)) return true;
}
return (this.thisFunction != null ? this.thisFunction.isVariable (ident) : this.contextVariables != null && this.contextVariables.containsKey (ident));
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "cleanScriptComments", 
($fz = function (script) {
if (script.indexOf ('\u201C') >= 0) script = script.$replace ('\u201C', '"');
if (script.indexOf ('\u201D') >= 0) script = script.$replace ('\u201D', '"');
if (script.indexOf ('\uFEFF') >= 0) script = script.$replace ('\uFEFF', ' ');
var pt = (script.indexOf ("\1##"));
if (pt >= 0) {
this.scriptExtensions = script.substring (pt + 1);
script = script.substring (0, pt);
this.allowMissingEnd = (this.scriptExtensions.indexOf ("##noendcheck") >= 0);
}this.haveComments = (script.indexOf ("#") >= 0);
return J.io.JmolBinary.getEmbeddedScript (script);
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "addTokenToPrefix", 
($fz = function (token) {
if (this.logMessages) J.util.Logger.info ("addTokenToPrefix" + token);
this.ltoken.addLast (token);
if (token.tok != 0) this.lastToken = token;
}, $fz.isPrivate = true, $fz), "J.script.T");
$_M(c$, "compile0", 
($fz = function (isFull) {
this.vFunctionStack =  new J.util.JmolList ();
this.htUserFunctions =  new java.util.Hashtable ();
this.script = this.cleanScriptComments (this.script);
this.ichToken = this.script.indexOf ("# Jmol state version ");
this.isStateScript = (this.ichToken >= 0);
if (this.isStateScript) {
this.ptSemi = this.script.indexOf (";", this.ichToken);
if (this.ptSemi >= this.ichToken) this.viewer.setStateScriptVersion (this.script.substring (this.ichToken + "# Jmol state version ".length, this.ptSemi).trim ());
}this.cchScript = this.script.length;
this.contextVariables = null;
this.lineNumbers = null;
this.lineIndices = null;
this.aatokenCompiled = null;
this.thisFunction = null;
this.flowContext = null;
this.errorType = null;
this.errorMessage = null;
this.errorMessageUntranslated = null;
this.errorLine = null;
this.nSemiSkip = 0;
this.ichToken = 0;
this.ichCurrentCommand = 0;
this.ichComment = 0;
this.ichBrace = 0;
this.lineCurrent = 1;
this.iCommand = 0;
this.tokLastMath = 0;
this.lastToken = J.script.T.tokenOff;
this.vBraces =  new J.util.JmolList ();
this.vPush =  new J.util.JmolList ();
this.pushCount = 0;
this.iBrace = 0;
this.braceCount = 0;
this.parenCount = 0;
this.ptSemi = -10;
this.cchToken = 0;
this.lnLength = 8;
this.lineNumbers =  Clazz.newShortArray (this.lnLength, 0);
this.lineIndices =  Clazz.newIntArray (this.lnLength, 2, 0);
this.isNewSet = this.isSetBrace = false;
this.ptNewSetModifier = 1;
this.isShowScriptOutput = false;
this.iHaveQuotedString = false;
this.checkImpliedScriptCmd = false;
this.lltoken =  new J.util.JmolList ();
this.ltoken =  new J.util.JmolList ();
this.tokCommand = 0;
this.lastFlowCommand = null;
this.tokenAndEquals = null;
this.tokInitialPlusPlus = 0;
this.setBraceCount = 0;
this.bracketCount = 0;
this.forPoint3 = -1;
this.setEqualPt = 2147483647;
this.endOfLine = false;
this.comment = null;
this.isEndOfCommand = false;
this.needRightParen = false;
this.theTok = 0;
var iLine = 1;
for (; true; this.ichToken += this.cchToken) {
if ((this.nTokens = this.ltoken.size ()) == 0) {
if (this.thisFunction != null && this.thisFunction.chpt0 == 0) this.thisFunction.chpt0 = this.ichToken;
this.ichCurrentCommand = this.ichToken;
iLine = this.lineCurrent;
}if (this.lookingAtLeadingWhitespace ()) continue;
this.endOfLine = false;
if (!this.isEndOfCommand) {
this.endOfLine = this.lookingAtEndOfLine ();
switch (this.endOfLine ? 0 : this.lookingAtComment ()) {
case 2:
continue;
case 3:
this.isEndOfCommand = true;
continue;
case 1:
this.isEndOfCommand = true;
this.comment = this.script.substring (this.ichToken, this.ichToken + this.cchToken).trim ();
break;
}
this.isEndOfCommand = this.isEndOfCommand || this.endOfLine || this.lookingAtEndOfStatement ();
}if (this.isEndOfCommand) {
this.isEndOfCommand = false;
switch (this.processTokenList (iLine, isFull)) {
case 2:
continue;
case 4:
return false;
}
this.checkImpliedScriptCmd = false;
if (this.ichToken < this.cchScript) continue;
this.setAaTokenCompiled ();
return (this.flowContext == null || this.errorStr (11, J.script.T.nameOf (this.flowContext.token.tok)));
}if (this.nTokens > 0) {
switch (this.checkSpecialParameterSyntax ()) {
case 2:
continue;
case 4:
return false;
}
}if (this.lookingAtLookupToken (this.ichToken)) {
var ident = this.getPrefixToken ();
switch (this.parseKnownToken (ident)) {
case 2:
continue;
case 4:
return false;
}
switch (this.parseCommandParameter (ident)) {
case 2:
continue;
case 4:
return false;
}
this.addTokenToPrefix (this.theToken);
continue;
}if (this.nTokens == 0 || (this.isNewSet || this.isSetBrace) && this.nTokens == this.ptNewSetModifier) {
if (this.nTokens == 0) {
if (this.lookingAtString (true)) {
this.addTokenToPrefix (this.setCommand (J.script.T.tokenScript));
this.cchToken = 0;
continue;
}if (this.lookingAtImpliedString (true, true, true)) this.ichEnd = this.ichToken + this.cchToken;
}return this.commandExpected ();
}return this.errorStr (19, this.script.substring (this.ichToken, this.ichToken + 1));
}
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "setAaTokenCompiled", 
($fz = function () {
this.aatokenCompiled = this.lltoken.toArray ( new Array (this.lltoken.size ()));
}, $fz.isPrivate = true, $fz));
$_M(c$, "lookingAtLeadingWhitespace", 
($fz = function () {
var ichT = this.ichToken;
while (ichT < this.cchScript && J.script.ScriptCompiler.isSpaceOrTab (this.script.charAt (ichT))) ++ichT;

if (this.isLineContinuation (ichT, true)) ichT += 1 + this.nCharNewLine (ichT + 1);
this.cchToken = ichT - this.ichToken;
return this.cchToken > 0;
}, $fz.isPrivate = true, $fz));
$_M(c$, "isLineContinuation", 
($fz = function (ichT, checkMathop) {
var isEscaped = (ichT + 2 < this.cchScript && this.script.charAt (ichT) == '\\' && this.nCharNewLine (ichT + 1) > 0 || checkMathop && this.lookingAtMathContinuation (ichT));
if (isEscaped) this.lineCurrent++;
return isEscaped;
}, $fz.isPrivate = true, $fz), "~N,~B");
$_M(c$, "lookingAtMathContinuation", 
($fz = function (ichT) {
var n;
if (ichT >= this.cchScript || (n = this.nCharNewLine (ichT)) == 0 || this.lastToken.tok == 1048586) return false;
if (this.parenCount > 0 || this.bracketCount > 0) return true;
if ((this.tokCommand != 1085443 || !this.isNewSet) && this.tokCommand != 36865 && this.tokCommand != 36869) return false;
if (this.lastToken.tok == this.tokLastMath) return true;
ichT += n;
while (ichT < this.cchScript && J.script.ScriptCompiler.isSpaceOrTab (this.script.charAt (ichT))) ++ichT;

return (this.lookingAtLookupToken (ichT) && this.tokLastMath == 1);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "lookingAtEndOfLine", 
($fz = function () {
var ichT = this.ichEnd = this.ichToken;
if (this.ichToken >= this.cchScript) {
this.ichEnd = this.cchScript;
return true;
}var n = this.nCharNewLine (ichT);
if (n == 0) return false;
this.ichEnd = this.ichToken;
this.cchToken = n;
return true;
}, $fz.isPrivate = true, $fz));
$_M(c$, "nCharNewLine", 
($fz = function (ichT) {
var ch;
return (ichT >= this.cchScript ? 0 : (ch = this.script.charAt (ichT)) != '\r' ? (ch == '\n' ? 1 : 0) : ++ichT < this.cchScript && this.script.charAt (ichT) == '\n' ? 2 : 1);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "lookingAtEndOfStatement", 
($fz = function () {
var isSemi = (this.script.charAt (this.ichToken) == ';');
if (isSemi && this.nTokens > 0) this.ptSemi = this.nTokens;
if (!isSemi || this.nSemiSkip-- > 0) return false;
this.cchToken = 1;
return true;
}, $fz.isPrivate = true, $fz));
$_M(c$, "lookingAtComment", 
($fz = function () {
var ch = this.script.charAt (this.ichToken);
var ichT = this.ichToken;
var ichFirstSharp = -1;
if (this.ichToken == this.ichCurrentCommand && ch == '$') {
this.isShowScriptOutput = true;
this.isShowCommand = true;
while (ch != ']' && ichT < this.cchScript && !this.eol (ch = this.script.charAt (ichT))) ++ichT;

this.cchToken = ichT - this.ichToken;
return 2;
} else if (this.isShowScriptOutput && !this.isShowCommand) {
ichFirstSharp = ichT;
}if (ch == '/' && ichT + 1 < this.cchScript) switch (this.script.charAt (++ichT)) {
case '/':
ichFirstSharp = this.ichToken;
this.ichEnd = ichT - 1;
break;
case '*':
this.ichEnd = ichT - 1;
var terminator = (++ichT < this.cchScript && (ch = this.script.charAt (ichT)) == '*' ? "**/" : "*/");
ichT = this.script.indexOf (terminator, this.ichToken + 2);
if (ichT < 0) {
this.ichToken = this.cchScript;
return 3;
}this.incrementLineCount (this.script.substring (this.ichToken, ichT));
this.cchToken = ichT + (ch == '*' ? 3 : 2) - this.ichToken;
return 2;
default:
return 0;
}
var isSharp = (ichFirstSharp < 0);
if (isSharp && !this.haveComments) return 0;
if (this.ichComment > ichT) ichT = this.ichComment;
for (; ichT < this.cchScript; ichT++) {
if (this.eol (ch = this.script.charAt (ichT))) {
this.ichEnd = ichT;
if (ichT > 0 && this.isLineContinuation (ichT - 1, false)) {
ichT += this.nCharNewLine (ichT);
continue;
}if (!isSharp && ch == ';') continue;
break;
}if (ichFirstSharp >= 0) continue;
if (ch == '#') ichFirstSharp = ichT;
}
if (ichFirstSharp < 0) return 0;
this.ichComment = ichFirstSharp;
if (isSharp && this.nTokens == 0 && this.cchScript - ichFirstSharp >= 3 && this.script.charAt (ichFirstSharp + 1) == 'j' && this.script.charAt (ichFirstSharp + 2) == 'c') {
this.cchToken = ichT - this.ichToken;
return 2;
}if (ichFirstSharp != this.ichToken) return 0;
if (isSharp && this.cchScript > this.ichToken + 3 && this.script.charAt (this.ichToken + 1) == 'j' && this.script.charAt (this.ichToken + 2) == 'x' && J.script.ScriptCompiler.isSpaceOrTab (this.script.charAt (this.ichToken + 3))) {
this.cchToken = 4;
return 2;
}if (ichT == this.ichToken) return 0;
this.cchToken = ichT - this.ichToken;
return (this.nTokens == 0 ? 1 : 2);
}, $fz.isPrivate = true, $fz));
$_M(c$, "processTokenList", 
($fz = function (iLine, doCompile) {
if (this.nTokens > 0 || this.comment != null) {
if (this.nTokens == 0) {
this.ichCurrentCommand = this.ichToken;
if (this.comment != null) {
this.isComment = true;
this.addTokenToPrefix (J.script.T.o (0, this.comment));
}} else if (this.setBraceCount > 0 && this.endOfLine && this.ichToken < this.cchScript) {
return 2;
}if (this.tokCommand == 135271429 && this.checkImpliedScriptCmd) {
var s = (this.nTokens == 2 ? this.lastToken.value.toString ().toUpperCase () : null);
if (this.nTokens > 2 && !(this.tokAt (2) == 269484048 && this.ltoken.get (1).value.toString ().endsWith (".spt")) || s != null && (s.endsWith (".SORT") || s.endsWith (".REVERSE") || s.indexOf (".SORT(") >= 0 || s.indexOf (".REVERSE(") >= 0)) {
this.ichToken = this.ichCurrentCommand;
this.nTokens = 0;
this.ltoken.clear ();
this.cchToken = 0;
this.tokCommand = 0;
return 2;
}}if (this.isNewSet && this.nTokens > 2 && this.tokAt (2) == 1048584 && (this.tokAt (3) == 1276117010 || this.tokAt (3) == 1141899269)) {
this.ltoken.set (0, J.script.T.tokenSet);
this.ltoken.add (1, this.ltoken.get (1));
} else if (this.tokInitialPlusPlus != 0) {
if (!this.isNewSet) this.checkNewSetCommand ();
this.tokenizePlusPlus (this.tokInitialPlusPlus, true);
}this.iCommand = this.lltoken.size ();
if (this.thisFunction != null && this.thisFunction.cmdpt0 < 0) {
this.thisFunction.cmdpt0 = this.iCommand;
}if (this.nTokens == 1 && this.braceCount == 1) {
if (this.lastFlowCommand == null) {
this.parenCount = this.setBraceCount = this.braceCount = 0;
this.ltoken.remove (0);
this.iBrace++;
var t = J.script.ContextToken.newContext (true);
this.addTokenToPrefix (this.setCommand (t));
this.pushCount++;
this.vPush.addLast (t);
this.vBraces.addLast (this.tokenCommand);
} else {
this.parenCount = this.setBraceCount = 0;
this.setCommand (this.lastFlowCommand);
if (this.lastFlowCommand.tok != 102439 && (this.tokAt (0) == 1048586)) this.ltoken.remove (0);
this.lastFlowCommand = null;
}}if (this.bracketCount > 0 || this.setBraceCount > 0 || this.parenCount > 0 || this.braceCount == 1 && !this.checkFlowStartBrace (true)) {
this.error (this.nTokens == 1 ? 2 : 4);
return 4;
}if (this.needRightParen) {
this.addTokenToPrefix (J.script.T.tokenRightParen);
this.needRightParen = false;
}if (this.ltoken.size () > 0) {
if (doCompile && !this.compileCommand ()) return 4;
if (this.logMessages) {
J.util.Logger.debug ("-------------------------------------");
}var doEval = true;
switch (this.tokCommand) {
case 364558:
case 102436:
case 135368713:
case 1150985:
doEval = (this.atokenInfix.length > 0 && this.atokenInfix[0].intValue != 2147483647);
break;
}
if (doEval) {
if (this.iCommand == this.lnLength) {
this.lineNumbers = J.util.ArrayUtil.doubleLengthShort (this.lineNumbers);
var lnI =  Clazz.newIntArray (this.lnLength * 2, 2, 0);
System.arraycopy (this.lineIndices, 0, lnI, 0, this.lnLength);
this.lineIndices = lnI;
this.lnLength *= 2;
}this.lineNumbers[this.iCommand] = iLine;
this.lineIndices[this.iCommand][0] = this.ichCurrentCommand;
this.lineIndices[this.iCommand][1] = Math.max (this.ichCurrentCommand, Math.min (this.cchScript, this.ichEnd == this.ichCurrentCommand ? this.ichToken : this.ichEnd));
this.lltoken.addLast (this.atokenInfix);
this.iCommand = this.lltoken.size ();
}if (this.tokCommand == 1085443) this.lastFlowCommand = null;
}this.setCommand (null);
this.comment = null;
this.iHaveQuotedString = this.isNewSet = this.isSetBrace = this.needRightParen = false;
this.ptNewSetModifier = 1;
this.ltoken.clear ();
this.nTokens = this.nSemiSkip = 0;
this.tokInitialPlusPlus = 0;
this.tokenAndEquals = null;
this.ptSemi = -10;
this.forPoint3 = -1;
this.setEqualPt = 2147483647;
}if (this.endOfLine) {
if (this.flowContext != null && this.flowContext.checkForceEndIf ()) {
if (!this.isComment) this.forceFlowEnd (this.flowContext.token);
this.isEndOfCommand = true;
this.cchToken = 0;
this.ichCurrentCommand = this.ichToken;
this.lineCurrent--;
return 2;
}this.isComment = false;
this.isShowCommand = false;
++this.lineCurrent;
}if (this.ichToken >= this.cchScript) {
this.setCommand (J.script.T.tokenAll);
this.theTok = 0;
switch (this.checkFlowEndBrace ()) {
case 4:
return 4;
case 2:
this.isEndOfCommand = true;
this.cchToken = 0;
return 2;
}
this.ichToken = this.cchScript;
return 0;
}return 0;
}, $fz.isPrivate = true, $fz), "~N,~B");
$_M(c$, "compileCommand", 
($fz = function () {
switch (this.ltoken.size ()) {
case 0:
this.atokenInfix =  new Array (0);
return true;
case 4:
if (this.isNewSet && this.tokenAt (2).value.equals (".") && this.tokenAt (3).value.equals ("spt")) {
var fname = this.tokenAt (1).value + "." + this.tokenAt (3).value;
this.ltoken.clear ();
this.addTokenToPrefix (J.script.T.tokenScript);
this.addTokenToPrefix (J.script.T.o (4, fname));
this.isNewSet = false;
}}
this.setCommand (this.tokenAt (0));
var size = this.ltoken.size ();
if (size == 1 && J.script.T.tokAttr (this.tokCommand, 524288)) this.addTokenToPrefix (J.script.T.tokenOn);
if (this.tokenAndEquals != null) {
var j;
var i = 0;
for (i = 1; i < size; i++) {
if ((j = this.tokAt (i)) == 269484242) break;
}
size = i;
i++;
if (this.ltoken.size () < i) {
J.util.Logger.error ("COMPILER ERROR! - andEquals ");
} else {
for (j = 1; j < size; j++, i++) this.ltoken.add (i, this.tokenAt (j));

this.ltoken.set (size, J.script.T.tokenEquals);
this.ltoken.add (i, this.tokenAndEquals);
this.ltoken.add (++i, J.script.T.tokenLeftParen);
this.addTokenToPrefix (J.script.T.tokenRightParen);
}}this.atokenInfix = this.ltoken.toArray ( new Array (size = this.ltoken.size ()));
if (this.logMessages) {
J.util.Logger.debug ("token list:");
for (var i = 0; i < this.atokenInfix.length; i++) J.util.Logger.debug (i + ": " + this.atokenInfix[i]);

J.util.Logger.debug ("vBraces list:");
for (var i = 0; i < this.vBraces.size (); i++) J.util.Logger.debug (i + ": " + this.vBraces.get (i));

J.util.Logger.debug ("-------------------------------------");
}return this.compileExpressions ();
}, $fz.isPrivate = true, $fz));
$_M(c$, "tokenAt", 
($fz = function (i) {
return this.ltoken.get (i);
}, $fz.isPrivate = true, $fz), "~N");
Clazz.overrideMethod (c$, "tokAt", 
function (i) {
return (i < this.ltoken.size () ? this.tokenAt (i).tok : 0);
}, "~N");
$_M(c$, "setCommand", 
($fz = function (token) {
this.tokenCommand = token;
if (token == null) {
this.tokCommand = 0;
} else {
this.tokCommand = this.tokenCommand.tok;
this.isMathExpressionCommand = (this.tokCommand == 1073741824 || J.script.T.tokAttr (this.tokCommand, 36864));
this.isSetOrDefine = (this.tokCommand == 1085443 || this.tokCommand == 1060866);
this.isCommaAsOrAllowed = J.script.T.tokAttr (this.tokCommand, 12288);
}return token;
}, $fz.isPrivate = true, $fz), "J.script.T");
$_M(c$, "replaceCommand", 
($fz = function (token) {
this.ltoken.remove (0);
this.ltoken.add (0, this.setCommand (token));
}, $fz.isPrivate = true, $fz), "J.script.T");
$_M(c$, "getPrefixToken", 
($fz = function () {
var ident = this.script.substring (this.ichToken, this.ichToken + this.cchToken);
var identLC = ident.toLowerCase ();
var isUserVar = this.isContextVariable (identLC);
if (this.nTokens == 0) this.isUserToken = isUserVar;
if (this.nTokens == 1 && (this.tokCommand == 135368713 || this.tokCommand == 102436 || this.tokCommand == 36868) || this.nTokens != 0 && isUserVar || this.isUserFunction (identLC) && (this.thisFunction == null || !this.thisFunction.name.equals (identLC))) {
ident = identLC;
this.theToken = null;
} else if (ident.length == 1) {
if ((this.theToken = J.script.T.getTokenFromName (ident)) == null && (this.theToken = J.script.T.getTokenFromName (identLC)) != null) this.theToken = J.script.T.tv (this.theToken.tok, this.theToken.intValue, ident);
} else {
ident = identLC;
this.theToken = J.script.T.getTokenFromName (ident);
}if (this.theToken == null) {
if (ident.indexOf ("property_") == 0) this.theToken = J.script.T.o (1716520973, ident);
 else this.theToken = J.script.T.o (1073741824, ident);
}this.theTok = this.theToken.tok;
return ident;
}, $fz.isPrivate = true, $fz));
$_M(c$, "checkSpecialParameterSyntax", 
($fz = function () {
var ch;
if (this.nTokens == this.ptNewSetModifier) {
ch = this.script.charAt (this.ichToken);
var isAndEquals = ("+-\\*/&|=".indexOf (ch) >= 0);
var isOperation = (isAndEquals || ch == '.' || ch == '[');
var ch2 = (this.ichToken + 1 >= this.cchScript ? 0 : this.script.charAt (this.ichToken + 1));
if (!this.isNewSet && this.isUserToken && isOperation && (ch == '=' || ch2 == ch || ch2 == '=')) {
this.isNewSet = true;
}if (this.isNewSet || this.tokCommand == 1085443 || J.script.T.tokAttr (this.tokCommand, 536870912)) {
if (ch == '=') this.setEqualPt = this.ichToken;
if (J.script.T.tokAttr (this.tokCommand, 536870912) && ch == '=' || (this.isNewSet || this.isSetBrace) && isOperation) {
this.setCommand (isAndEquals ? J.script.T.tokenSet : ch == '[' && !this.isSetBrace ? J.script.T.tokenSetArray : J.script.T.tokenSetProperty);
this.ltoken.add (0, this.tokenCommand);
this.cchToken = 1;
switch (ch) {
case '[':
this.addTokenToPrefix (J.script.T.o (269484096, "["));
this.bracketCount++;
return 2;
case '.':
this.addTokenToPrefix (J.script.T.o (1048584, "."));
return 2;
case '-':
case '+':
case '*':
case '/':
case '\\':
case '&':
case '|':
if (ch2.charCodeAt (0) == 0) return this.ERROR (4);
if (ch2 != ch && ch2 != '=') return this.ERROR (1, "\"" + ch + "\"");
break;
default:
this.lastToken = J.script.T.tokenMinus;
return 2;
}
}}}if (this.lookingAtString (!J.script.T.tokAttr (this.tokCommand, 20480))) {
if (this.cchToken < 0) return this.ERROR (4);
var str;
if ((this.tokCommand == 1085443 && this.nTokens == 2 && this.lastToken.tok == 545259546 || this.tokCommand == 135271426 || this.tokCommand == 1610616835 || this.tokCommand == 135271429) && !this.iHaveQuotedString) {
if (this.lastToken.tok == 1073741983) {
str = this.getUnescapedStringLiteral ();
} else {
str = this.script.substring (this.ichToken + 1, this.ichToken + this.cchToken - 1);
if (str.indexOf ("\\u") >= 0) str = J.util.Escape.unescapeUnicode (str);
}} else {
str = this.getUnescapedStringLiteral ();
}this.iHaveQuotedString = true;
if (this.tokCommand == 135271426 && this.lastToken.tok == 135270407 || this.tokCommand == 135270407 && str.indexOf ("@") < 0) {
if (!this.getData (str)) {
return this.ERROR (11, "data");
}} else {
this.addTokenToPrefix (J.script.T.o (4, str));
if (J.script.T.tokAttr (this.tokCommand, 20480)) this.isEndOfCommand = true;
}return 2;
}if (this.tokCommand == 4156 && this.nTokens == 1 && this.charToken ()) {
var ident = this.script.substring (this.ichToken, this.ichToken + this.cchToken);
var iident = J.util.Parser.parseInt (ident);
if (iident == -2147483648 || Math.abs (iident) < 1000) this.addTokenToPrefix (J.script.T.o (1073741824, ident));
 else this.addTokenToPrefix (J.script.T.i (iident));
return 2;
}switch (this.tokCommand) {
case 135271426:
case 135271429:
case 135270410:
if (this.script.charAt (this.ichToken) == '@') {
this.iHaveQuotedString = true;
return 0;
}if (this.tokCommand == 135271426) {
if ((this.nTokens == 1 || this.nTokens == 2 && this.tokAt (1) == 1073741839) && this.lookingAtLoadFormat ()) {
var strFormat = this.script.substring (this.ichToken, this.ichToken + this.cchToken);
var token = J.script.T.getTokenFromName (strFormat.toLowerCase ());
switch (token == null ? 0 : token.tok) {
case 1073742015:
case 1073741839:
if (this.nTokens != 1) return 4;
case 135270407:
case 1229984263:
case 1073741983:
case 1095766028:
case 135267336:
case 536870926:
case 4156:
this.addTokenToPrefix (token);
break;
default:
var tok = (strFormat.indexOf ("=") == 0 || strFormat.indexOf ("$") == 0 ? 4 : J.util.Parser.isOneOf (strFormat = strFormat.toLowerCase (), "xyz;vxyz;vibration;temperature;occupancy;partialcharge") ? 1073741824 : 0);
if (tok != 0) {
this.addTokenToPrefix (J.script.T.o (tok, strFormat));
this.iHaveQuotedString = (tok == 4);
}}
return 2;
}var bs;
if (this.script.charAt (this.ichToken) == '{' || this.parenCount > 0) break;
if ((bs = this.lookingAtBitset ()) != null) {
this.addTokenToPrefix (J.script.T.o (10, bs));
return 2;
}}if (!this.iHaveQuotedString && this.lookingAtImpliedString (false, this.tokCommand == 135271426, this.nTokens > 1 || this.tokCommand != 135271429)) {
var str = this.script.substring (this.ichToken, this.ichToken + this.cchToken);
if (this.tokCommand == 135271429 && str.startsWith ("javascript:")) {
this.lookingAtImpliedString (true, true, true);
str = this.script.substring (this.ichToken, this.ichToken + this.cchToken);
}this.addTokenToPrefix (J.script.T.o (4, str));
this.iHaveQuotedString = true;
return 2;
}break;
case 135270421:
if (this.nTokens == 2 && this.lastToken.tok == 4115) this.iHaveQuotedString = true;
if (!this.iHaveQuotedString) {
if (this.script.charAt (this.ichToken) == '@') {
this.iHaveQuotedString = true;
return 0;
}if (this.lookingAtImpliedString (true, true, true)) {
var pt = this.cchToken;
var str = this.script.substring (this.ichToken, this.ichToken + this.cchToken);
if (str.indexOf (" ") < 0) {
this.addTokenToPrefix (J.script.T.o (4, str));
this.iHaveQuotedString = true;
return 2;
}this.cchToken = pt;
}}break;
}
if (J.script.T.tokAttr (this.tokCommand, 20480) && !(this.tokCommand == 135271429 && this.iHaveQuotedString) && this.lookingAtImpliedString (true, true, true)) {
var str = this.script.substring (this.ichToken, this.ichToken + this.cchToken);
if (this.tokCommand == 1826248715 && J.util.Parser.isOneOf (str.toLowerCase (), "on;off;hide;display")) this.addTokenToPrefix (J.script.T.getTokenFromName (str.toLowerCase ()));
 else this.addTokenToPrefix (J.script.T.o (4, str));
return 2;
}var value;
if (!Float.isNaN (value = this.lookingAtExponential ())) {
this.addTokenToPrefix (J.script.T.o (3, Float.$valueOf (value)));
return 2;
}if (this.lookingAtObjectID (this.nTokens == 1)) {
this.addTokenToPrefix (J.script.T.getTokenFromName ("$"));
this.addTokenToPrefix (J.script.T.o (1073741824, this.script.substring (this.ichToken, this.ichToken + this.cchToken)));
return 2;
}if (this.lookingAtDecimal ()) {
value = J.util.Parser.fVal (this.script.substring (this.ichToken, this.ichToken + this.cchToken));
var intValue = (J.script.ScriptEvaluator.getFloatEncodedInt (this.script.substring (this.ichToken, this.ichToken + this.cchToken)));
this.addTokenToPrefix (J.script.T.tv (3, intValue, Float.$valueOf (value)));
return 2;
}if (this.lookingAtSeqcode ()) {
ch = this.script.charAt (this.ichToken);
try {
var seqNum = (ch == '*' || ch == '^' ? 2147483647 : Integer.parseInt (this.script.substring (this.ichToken, this.ichToken + this.cchToken - 2)));
var insertionCode = this.script.charAt (this.ichToken + this.cchToken - 1);
if (insertionCode == '^') insertionCode = ' ';
if (seqNum < 0) {
seqNum = -seqNum;
this.addTokenToPrefix (J.script.T.tokenMinus);
}var seqcode = J.modelset.Group.getSeqcodeFor (seqNum, insertionCode);
this.addTokenToPrefix (J.script.T.tv (5, seqcode, "seqcode"));
return 2;
} catch (nfe) {
if (Clazz.exceptionOf (nfe, NumberFormatException)) {
return this.ERROR (9, "" + ch);
} else {
throw nfe;
}
}
}var val = this.lookingAtInteger ();
if (val != 2147483647) {
var intString = this.script.substring (this.ichToken, this.ichToken + this.cchToken);
if (this.tokCommand == 102407 || this.tokCommand == 102408) {
if (this.nTokens != 1) return this.ERROR (0);
var f = (this.flowContext == null ? null : this.flowContext.getBreakableContext (val = Math.abs (val)));
if (f == null) return this.ERROR (1, this.tokenCommand.value);
this.tokenAt (0).intValue = f.pt0;
}if (val == 0 && intString.equals ("-0")) this.addTokenToPrefix (J.script.T.tokenMinus);
this.addTokenToPrefix (J.script.T.tv (2, val, intString));
return 2;
}if (!this.isMathExpressionCommand && this.parenCount == 0 || this.lastToken.tok != 1073741824 && !J.script.ScriptCompilationTokenParser.tokenAttr (this.lastToken, 135266304)) {
var isBondOrMatrix = (this.script.charAt (this.ichToken) == '[');
var bs = this.lookingAtBitset ();
if (bs == null) {
if (isBondOrMatrix) {
var m = this.lookingAtMatrix ();
if (Clazz.instanceOf (m, J.util.Matrix3f) || Clazz.instanceOf (m, J.util.Matrix4f)) {
this.addTokenToPrefix (J.script.T.o ((Clazz.instanceOf (m, J.util.Matrix3f) ? 11 : 12), m));
return 2;
}}} else {
if (isBondOrMatrix) this.addTokenToPrefix (J.script.T.o (10,  new J.modelset.Bond.BondSet (bs)));
 else this.addTokenToPrefix (J.script.T.o (10, bs));
return 2;
}}return 0;
}, $fz.isPrivate = true, $fz));
$_M(c$, "lookingAtMatrix", 
($fz = function () {
var ipt;
var m;
if (this.ichToken + 4 >= this.cchScript || this.script.charAt (this.ichToken) != '[' || this.script.charAt (this.ichToken + 1) != '[' || (ipt = this.script.indexOf ("]]", this.ichToken)) < 0 || (m = J.util.Escape.unescapeMatrix (this.script.substring (this.ichToken, ipt + 2))) == null) return null;
this.cchToken = ipt + 2 - this.ichToken;
return m;
}, $fz.isPrivate = true, $fz));
$_M(c$, "parseKnownToken", 
($fz = function (ident) {
var token;
if (this.tokLastMath != 0) this.tokLastMath = this.theTok;
if (this.flowContext != null && this.flowContext.token.tok == 102410 && this.flowContext.$var != null && this.theTok != 102411 && this.theTok != 102413 && this.lastToken.tok != 102410) return this.ERROR (1, ident);
switch (this.theTok) {
case 1073741824:
if (this.nTokens == 0 && !this.checkImpliedScriptCmd) {
if (ident.charAt (0) == '\'') {
this.addTokenToPrefix (this.setCommand (J.script.T.tokenScript));
this.cchToken = 0;
return 2;
}if (this.ichToken + this.cchToken < this.cchScript && this.script.charAt (this.ichToken + this.cchToken) == '.') {
this.addTokenToPrefix (this.setCommand (J.script.T.tokenScript));
this.nTokens = 1;
this.cchToken = 0;
this.checkImpliedScriptCmd = true;
return 2;
}}break;
case 269484242:
if (this.nSemiSkip == this.forPoint3 && this.nTokens == this.ptSemi + 2) {
token = this.lastToken;
this.addTokenToPrefix (J.script.T.tokenEquals);
this.addTokenToPrefix (token);
token = J.script.T.getTokenFromName (ident.substring (0, 1));
this.addTokenToPrefix (token);
this.addTokenToPrefix (J.script.T.tokenLeftParen);
this.needRightParen = true;
return 2;
}this.checkNewSetCommand ();
if (this.tokCommand == 1085443) {
this.tokenAndEquals = J.script.T.getTokenFromName (ident.substring (0, 1));
this.setEqualPt = this.ichToken;
return 0;
}if (this.tokCommand == 554176565 || this.tokCommand == 554176526) {
this.addTokenToPrefix (this.tokenCommand);
this.replaceCommand (J.script.T.tokenSet);
this.tokenAndEquals = J.script.T.getTokenFromName (ident.substring (0, 1));
this.setEqualPt = this.ichToken;
return 0;
}return 2;
case 1150985:
case 364548:
if (this.flowContext != null) this.flowContext.forceEndIf = false;
case 364547:
if (this.nTokens > 0) {
this.isEndOfCommand = true;
this.cchToken = 0;
return 2;
}break;
case 135369224:
if (this.bracketCount > 0) break;
case 102411:
case 102413:
case 102402:
case 135369225:
case 102410:
case 102406:
case 102412:
if (this.nTokens > 1 && this.tokCommand != 1085443) {
this.isEndOfCommand = true;
if (this.flowContext != null) this.flowContext.forceEndIf = true;
this.cchToken = 0;
return 2;
}break;
case 269484225:
case 269484226:
if (!this.isNewSet && this.nTokens == 1) this.checkNewSetCommand ();
if (this.isNewSet && this.parenCount == 0 && this.bracketCount == 0 && this.ichToken <= this.setEqualPt) {
this.tokenizePlusPlus (this.theTok, false);
return 2;
} else if (this.nSemiSkip == this.forPoint3 && this.nTokens == this.ptSemi + 2) {
token = this.lastToken;
this.addTokenToPrefix (J.script.T.tokenEquals);
this.addTokenToPrefix (token);
this.addTokenToPrefix (this.theTok == 269484225 ? J.script.T.tokenMinus : J.script.T.tokenPlus);
this.addTokenToPrefix (J.script.T.i (1));
return 2;
}break;
case 269484436:
if (this.parenCount == 0 && this.bracketCount == 0) this.setEqualPt = this.ichToken;
break;
case 1048584:
if (this.tokCommand == 1085443 && this.parenCount == 0 && this.bracketCount == 0 && this.ichToken < this.setEqualPt) {
this.ltoken.add (1, J.script.T.tokenExpressionBegin);
this.addTokenToPrefix (J.script.T.tokenExpressionEnd);
this.ltoken.set (0, J.script.T.tokenSetProperty);
this.setEqualPt = 0;
}break;
case 1048586:
this.braceCount++;
if (this.braceCount == 1 && this.parenCount == 0 && this.checkFlowStartBrace (false)) {
this.isEndOfCommand = true;
if (this.flowContext != null) this.flowContext.forceEndIf = false;
return 2;
}case 269484048:
this.parenCount++;
if (this.nTokens > 1 && (this.lastToken.tok == 135280132 || this.lastToken.tok == 135369224 || this.lastToken.tok == 135369225)) this.nSemiSkip += 2;
break;
case 1048590:
if (this.iBrace > 0 && this.parenCount == 0 && this.braceCount == 0) {
this.ichBrace = this.ichToken;
if (this.nTokens == 0) {
this.braceCount = this.parenCount = 1;
} else {
this.braceCount = this.parenCount = this.nSemiSkip = 0;
if (this.theToken.tok != 102411 && this.theToken.tok != 102413) this.vBraces.addLast (this.theToken);
this.iBrace++;
this.isEndOfCommand = true;
this.ichEnd = this.ichToken;
return 2;
}}this.braceCount--;
case 269484049:
this.parenCount--;
if (this.parenCount < 0) return this.ERROR (16, ident);
if (this.parenCount == 0) this.nSemiSkip = 0;
if (this.needRightParen) {
this.addTokenToPrefix (J.script.T.tokenRightParen);
this.needRightParen = false;
}break;
case 269484096:
if (this.ichToken > 0 && Character.isWhitespace (this.script.charAt (this.ichToken - 1))) this.addTokenToPrefix (J.script.T.tokenSpaceBeforeSquare);
this.bracketCount++;
break;
case 269484097:
this.bracketCount--;
if (this.bracketCount < 0) return this.ERROR (16, "]");
}
return 0;
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "tokenizePlusPlus", 
($fz = function (tok, isPlusPlusX) {
if (isPlusPlusX) {
this.setCommand (J.script.T.tokenSet);
this.ltoken.add (0, this.tokenCommand);
}this.nTokens = this.ltoken.size ();
this.addTokenToPrefix (J.script.T.tokenEquals);
this.setEqualPt = 0;
for (var i = 1; i < this.nTokens; i++) this.addTokenToPrefix (this.ltoken.get (i));

this.addTokenToPrefix (tok == 269484225 ? J.script.T.tokenMinus : J.script.T.tokenPlus);
this.addTokenToPrefix (J.script.T.i (1));
}, $fz.isPrivate = true, $fz), "~N,~B");
$_M(c$, "checkNewSetCommand", 
($fz = function () {
var name = this.ltoken.get (0).value.toString ();
if (!this.isContextVariable (name.toLowerCase ())) return false;
var t = this.setNewSetCommand (false, name);
this.setCommand (J.script.T.tokenSet);
this.ltoken.add (0, this.tokenCommand);
this.ltoken.set (1, t);
return true;
}, $fz.isPrivate = true, $fz));
$_M(c$, "parseCommandParameter", 
($fz = function (ident) {
this.nTokens = this.ltoken.size ();
switch (this.tokCommand) {
case 0:
this.lastToken = J.script.T.tokenOff;
this.ichCurrentCommand = this.ichEnd = this.ichToken;
this.setCommand (this.theToken);
if (J.script.T.tokAttr (this.tokCommand, 102400)) {
this.lastFlowCommand = this.tokenCommand;
}var ret = this.checkFlowEndBrace ();
if (ret == 4) return 4;
 else if (ret == 2) {
this.isEndOfCommand = true;
this.cchToken = 0;
return 2;
}if (J.script.T.tokAttr (this.tokCommand, 102400)) {
if (!this.checkFlowCommand (this.tokenCommand.value)) return 4;
this.theToken = this.tokenCommand;
if (this.theTok == 102411) {
this.addTokenToPrefix (this.tokenCommand);
this.theToken = J.script.T.tokenLeftParen;
}break;
}if (this.theTok == 269484066) {
this.braceCount++;
this.isEndOfCommand = true;
break;
}if (this.theTok == 1048590) {
this.vBraces.addLast (this.tokenCommand);
this.iBrace++;
this.tokCommand = 0;
return 2;
}if (this.theTok != 1048586) this.lastFlowCommand = null;
if (J.script.T.tokAttr (this.tokCommand, 4096)) break;
this.isSetBrace = (this.theTok == 1048586);
if (this.isSetBrace) {
if (!this.lookingAtBraceSyntax ()) {
this.isEndOfCommand = true;
if (this.flowContext != null) this.flowContext.forceEndIf = false;
}} else {
switch (this.theTok) {
case 269484226:
case 269484225:
this.tokInitialPlusPlus = this.theTok;
this.tokCommand = 0;
return 2;
case 1073741824:
case 36868:
case 1060866:
case 269484048:
break;
default:
if (!J.script.T.tokAttr (this.theTok, 1073741824) && !J.script.T.tokAttr (this.theTok, 536870912) && !this.isContextVariable (ident)) {
this.commandExpected ();
return 4;
}}
}this.theToken = this.setNewSetCommand (this.isSetBrace, ident);
break;
case 102412:
switch (this.nTokens) {
case 1:
if (this.theTok != 269484048) return this.ERROR (15, "(");
break;
case 2:
if (this.theTok != 269484049) (this.tokenCommand).name0 = ident;
this.addContextVariable (ident);
break;
case 3:
if (this.theTok != 269484049) return this.ERROR (15, ")");
this.isEndOfCommand = true;
this.ichEnd = this.ichToken + 1;
this.flowContext.setLine ();
break;
default:
return this.ERROR (0);
}
break;
case 102436:
case 135368713:
if (this.tokenCommand.intValue == 0) {
if (this.nTokens != 1) break;
this.tokenCommand.value = ident;
return 2;
}if (this.nTokens == 1) {
if (this.thisFunction != null) this.vFunctionStack.add (0, this.thisFunction);
this.thisFunction = (this.tokCommand == 102436 ? J.script.ScriptCompiler.newScriptParallelProcessor (ident, this.tokCommand) :  new J.script.ScriptFunction (ident, this.tokCommand));
this.htUserFunctions.put (ident, Boolean.TRUE);
this.flowContext.setFunction (this.thisFunction);
break;
}if (this.nTokens == 2) {
if (this.theTok != 269484048) return this.ERROR (15, "(");
break;
}if (this.nTokens == 3 && this.theTok == 269484049) break;
if (this.nTokens % 2 == 0) {
if (this.theTok != 269484080 && this.theTok != 269484049) return this.ERROR (15, ")");
break;
}this.thisFunction.addVariable (ident, true);
break;
case 102411:
if (this.nTokens > 1 && this.parenCount == 0 && this.braceCount == 0 && this.theTok == 269484066) {
this.addTokenToPrefix (J.script.T.tokenRightParen);
this.braceCount = 1;
this.isEndOfCommand = true;
this.cchToken = 0;
return 2;
}break;
case 102413:
if (this.nTokens > 1) {
this.braceCount = 1;
this.isEndOfCommand = true;
this.cchToken = 0;
return 2;
}break;
case 364547:
if (this.nTokens == 1 && this.theTok != 135369225) {
this.isEndOfCommand = true;
this.cchToken = 0;
return 2;
}if (this.nTokens != 1 || this.theTok != 135369225 && this.theTok != 1048586) return this.ERROR (0);
this.replaceCommand (this.flowContext.token = J.script.ContextToken.newCmd (102402, "elseif"));
this.tokCommand = 102402;
return 2;
case 36868:
if (this.nTokens != 1) break;
this.addContextVariable (ident);
this.replaceCommand (J.script.T.tokenSetVar);
this.tokCommand = 1085443;
break;
case 1150985:
if (this.nTokens != 1) return this.ERROR (0);
if (!this.checkFlowEnd (this.theTok, ident, this.ichCurrentCommand)) return 4;
if (this.theTok == 135368713 || this.theTok == 102436) {
return 2;
}break;
case 102410:
case 102406:
if (this.nTokens > 2 && this.braceCount == 0 && this.parenCount == 0) {
this.isEndOfCommand = true;
this.ichEnd = this.ichToken + 1;
this.flowContext.setLine ();
}break;
case 102402:
case 135369225:
if (this.nTokens > 2 && this.braceCount == 0 && this.parenCount == 0) {
this.isEndOfCommand = true;
this.ichEnd = this.ichToken + 1;
this.flowContext.setLine ();
}break;
case 102439:
this.isEndOfCommand = true;
this.ichEnd = this.ichToken + 1;
this.flowContext.setLine ();
break;
case 135369224:
if (this.nTokens == 1) {
if (this.theTok != 269484048) return this.ERROR (19, ident);
this.forPoint3 = this.nSemiSkip = 0;
this.nSemiSkip += 2;
} else if (this.nTokens == 3 && this.tokAt (2) == 36868) {
this.addContextVariable (ident);
} else if ((this.nTokens == 3 || this.nTokens == 4) && this.theTok == 1073741980) {
this.nSemiSkip -= 2;
this.forPoint3 = 2;
this.addTokenToPrefix (this.theToken);
this.theToken = J.script.T.tokenLeftParen;
} else if (this.braceCount == 0 && this.parenCount == 0) {
this.isEndOfCommand = true;
this.ichEnd = this.ichToken + 1;
this.flowContext.setLine ();
}break;
case 1085443:
if (this.theTok == 1048586) this.setBraceCount++;
 else if (this.theTok == 1048590) {
this.setBraceCount--;
if (this.isSetBrace && this.setBraceCount == 0 && this.ptNewSetModifier == 2147483647) this.ptNewSetModifier = this.nTokens + 1;
}if (this.nTokens == this.ptNewSetModifier) {
var token = this.tokenAt (0);
if (this.theTok == 269484048 || this.isUserFunction (token.value.toString ())) {
this.ltoken.set (0, this.setCommand (J.script.T.tv (1073741824, 0, token.value)));
this.setBraceCount = 0;
break;
}if (this.theTok != 1073741824 && this.theTok != 269484242 && this.theTok != 1060866 && (!J.script.T.tokAttr (this.theTok, 536870912))) {
if (this.isNewSet) this.commandExpected ();
 else this.errorIntStr2 (18, "SET", ": " + ident);
return 4;
}if (this.nTokens == 1 && (this.lastToken.tok == 269484226 || this.lastToken.tok == 269484225)) {
this.replaceCommand (J.script.T.tokenSet);
this.addTokenToPrefix (this.lastToken);
break;
}}break;
case 135271426:
if (this.theTok == 1060866 && (this.nTokens == 1 || this.lastToken.tok == 1073741940 || this.lastToken.tok == 1073742152)) {
this.addTokenToPrefix (J.script.T.tokenDefineString);
return 2;
}if (this.theTok == 1073741848) this.iHaveQuotedString = false;
break;
case 1610625028:
case 12294:
case 12295:
case 135280132:
case 12291:
case 1060866:
if (this.tokCommand == 1060866) {
if (this.nTokens == 1) {
if (this.theTok != 1073741824) {
if (this.preDefining) {
if (!J.script.T.tokAttr (this.theTok, 3145728)) {
this.errorStr2 ("ERROR IN Token.java or JmolConstants.java -- the following term was used in JmolConstants.java but not listed as predefinedset in Token.java: " + ident, null);
return 4;
}} else if (J.script.T.tokAttr (this.theTok, 3145728)) {
J.util.Logger.warn ("WARNING: predefined term '" + ident + "' has been redefined by the user until the next file load.");
} else if (!this.isCheckOnly && ident.length > 1) {
J.util.Logger.warn ("WARNING: redefining " + ident + "; was " + this.theToken + "not all commands may continue to be functional for the life of the applet!");
this.theTok = this.theToken.tok = 1073741824;
J.script.T.addToken (ident, this.theToken);
}}this.addTokenToPrefix (this.theToken);
this.lastToken = J.script.T.tokenComma;
return 2;
}if (this.nTokens == 2) {
if (this.theTok == 269484436) {
this.ltoken.add (0, J.script.T.tokenSet);
return 2;
}}}if (this.bracketCount == 0 && this.theTok != 1073741824 && !J.script.T.tokAttr (this.theTok, 1048576) && !J.script.T.tokAttr (this.theTok, 1073741824) && (this.theTok & 480) != this.theTok) return this.ERROR (9, ident);
break;
case 12289:
if (this.theTok != 1073741824 && this.theTok != 1048583 && !J.script.T.tokAttr (this.theTok, 1048576)) return this.ERROR (9, ident);
break;
case 135190:
case 135188:
case 135180:
var ch = this.nextChar ();
if (this.parenCount == 0 && this.bracketCount == 0 && ".:/\\+-!?".indexOf (ch) >= 0 && !(ch == '-' && ident.equals ("="))) this.checkUnquotedFileName ();
}
return 0;
}, $fz.isPrivate = true, $fz), "~S");
c$.newScriptParallelProcessor = $_M(c$, "newScriptParallelProcessor", 
($fz = function (name, tok) {
var jpp = J.api.Interface.getOptionInterface ("parallel.ScriptParallelProcessor");
jpp.set (name, tok);
return jpp;
}, $fz.isPrivate = true, $fz), "~S,~N");
$_M(c$, "setNewSetCommand", 
($fz = function (isSetBrace, ident) {
this.tokCommand = 1085443;
this.isNewSet = (!isSetBrace && !this.isUserFunction (ident));
this.setBraceCount = (isSetBrace ? 1 : 0);
this.bracketCount = 0;
this.setEqualPt = 2147483647;
this.ptNewSetModifier = (this.isNewSet ? (ident.equals ("(") ? 2 : 1) : 2147483647);
return ((isSetBrace || this.theToken.tok == 269484226 || this.theToken.tok == 269484225) ? this.theToken : J.script.T.o (1073741824, ident));
}, $fz.isPrivate = true, $fz), "~B,~S");
$_M(c$, "nextChar", 
($fz = function () {
var ich = this.ichToken + this.cchToken;
return (ich >= this.cchScript ? ' ' : this.script.charAt (ich));
}, $fz.isPrivate = true, $fz));
$_M(c$, "checkUnquotedFileName", 
($fz = function () {
var ichT = this.ichToken;
var ch;
while (++ichT < this.cchScript && !Character.isWhitespace (ch = this.script.charAt (ichT)) && ch != '#' && ch != ';' && ch != '}') {
}
var name = this.script.substring (this.ichToken, ichT).$replace ('\\', '/');
this.cchToken = ichT - this.ichToken;
this.theToken = J.script.T.o (4, name);
}, $fz.isPrivate = true, $fz));
$_M(c$, "checkFlowStartBrace", 
($fz = function (atEnd) {
if ((!J.script.T.tokAttr (this.tokCommand, 102400) || this.tokCommand == 102407 || this.tokCommand == 102408)) return false;
if (atEnd) {
if (this.tokenCommand.tok != 102411 && this.tokenCommand.tok != 102413) {
this.iBrace++;
this.vBraces.addLast (this.tokenCommand);
this.lastFlowCommand = null;
}this.parenCount = this.braceCount = 0;
}return true;
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "checkFlowEndBrace", 
($fz = function () {
if (this.iBrace <= 0 || this.vBraces.get (this.iBrace - 1).tok != 1048590) return 0;
this.vBraces.remove (--this.iBrace);
var token = this.vBraces.remove (--this.iBrace);
if (this.theTok == 1048586) {
this.braceCount--;
this.parenCount--;
}if (token.tok == 266280) {
this.vPush.remove (--this.pushCount);
this.addTokenToPrefix (this.setCommand (J.script.ContextToken.newContext (true)));
this.isEndOfCommand = true;
return 2;
}switch (this.flowContext == null ? 0 : this.flowContext.token.tok) {
case 135369225:
case 102402:
case 364547:
if (this.tokCommand == 364547 || this.tokCommand == 102402) return 0;
break;
case 102410:
case 102411:
case 102413:
if (this.tokCommand == 102411 || this.tokCommand == 102413) return 0;
}
return this.forceFlowEnd (token);
}, $fz.isPrivate = true, $fz));
$_M(c$, "forceFlowEnd", 
($fz = function (token) {
var t0 = this.tokenCommand;
this.setCommand (J.script.T.o (1150985, "end"));
if (!this.checkFlowCommand ("end")) return 0;
this.addTokenToPrefix (this.tokenCommand);
switch (token.tok) {
case 135369225:
case 364547:
case 102402:
token = J.script.T.tokenIf;
break;
case 102413:
case 102411:
token = J.script.T.tokenSwitch;
break;
default:
token = J.script.T.getTokenFromName (token.value);
break;
}
if (!this.checkFlowEnd (token.tok, token.value, this.ichBrace)) return 4;
if (token.tok != 135368713 && token.tok != 102436 && token.tok != 364558) this.addTokenToPrefix (token);
this.setCommand (t0);
return 2;
}, $fz.isPrivate = true, $fz), "J.script.T");
c$.isBreakableContext = $_M(c$, "isBreakableContext", 
function (tok) {
return tok == 135369224 || tok == 102439 || tok == 102406 || tok == 102411 || tok == 102413;
}, "~N");
$_M(c$, "checkFlowCommand", 
($fz = function (ident) {
var pt = this.lltoken.size ();
var isEnd = false;
var isNew = true;
switch (this.tokCommand) {
case 135368713:
case 102436:
if (this.flowContext != null) return this.errorStr (1, J.script.T.nameOf (this.tokCommand));
break;
case 1150985:
if (this.flowContext == null) return this.errorStr (1, ident);
isEnd = true;
if (this.flowContext.token.tok != 135368713 && this.flowContext.token.tok != 102436 && this.flowContext.token.tok != 364558) this.setCommand (J.script.T.tv (this.tokCommand, (this.flowContext.ptDefault > 0 ? this.flowContext.ptDefault : -this.flowContext.pt0), ident));
break;
case 364558:
case 102412:
break;
case 135369224:
case 135369225:
case 102439:
case 102410:
case 102406:
break;
case 364548:
isEnd = true;
if (this.flowContext == null || this.flowContext.token.tok != 135369225 && this.flowContext.token.tok != 102439 && this.flowContext.token.tok != 364547 && this.flowContext.token.tok != 102402) return this.errorStr (1, ident);
break;
case 364547:
if (this.flowContext == null || this.flowContext.token.tok != 135369225 && this.flowContext.token.tok != 102402) return this.errorStr (1, ident);
this.flowContext.token.intValue = this.flowContext.setPt0 (pt, false);
break;
case 102407:
case 102408:
isNew = false;
var f = (this.flowContext == null ? null : this.flowContext.getBreakableContext (0));
if (this.tokCommand == 102408) while (f != null && f.token.tok != 135369224 && f.token.tok != 102406) f = f.getParent ();

if (f == null) return this.errorStr (1, ident);
this.setCommand (J.script.T.tv (this.tokCommand, f.pt0, ident));
break;
case 102413:
if (this.flowContext == null || this.flowContext.token.tok != 102410 && this.flowContext.token.tok != 102411 && this.flowContext.ptDefault > 0) return this.errorStr (1, ident);
this.flowContext.token.intValue = this.flowContext.setPt0 (pt, true);
break;
case 102411:
if (this.flowContext == null || this.flowContext.token.tok != 102410 && this.flowContext.token.tok != 102411 && this.flowContext.token.tok != 102413) return this.errorStr (1, ident);
this.flowContext.token.intValue = this.flowContext.setPt0 (pt, false);
break;
case 102402:
if (this.flowContext == null || this.flowContext.token.tok != 135369225 && this.flowContext.token.tok != 102402 && this.flowContext.token.tok != 364547) return this.errorStr (1, "elseif");
this.flowContext.token.intValue = this.flowContext.setPt0 (pt, false);
break;
}
if (isEnd) {
this.flowContext.token.intValue = (this.tokCommand == 102412 ? -pt : pt);
if (this.tokCommand == 364548) this.flowContext = this.flowContext.getParent ();
if (this.tokCommand == 364558) {
}} else if (isNew) {
var ct = J.script.ContextToken.newCmd (this.tokCommand, this.tokenCommand.value);
if (this.tokCommand == 102410) ct.addName ("_var");
this.setCommand (ct);
switch (this.tokCommand) {
case 364558:
this.flowContext =  new J.script.ScriptFlowContext (this, ct, pt, this.flowContext);
if (this.thisFunction != null) this.vFunctionStack.add (0, this.thisFunction);
this.thisFunction = J.script.ScriptCompiler.newScriptParallelProcessor ("", this.tokCommand);
this.flowContext.setFunction (this.thisFunction);
this.pushCount++;
this.vPush.addLast (ct);
break;
case 364547:
case 102402:
this.flowContext.token = ct;
break;
case 102411:
case 102413:
ct.contextVariables = this.flowContext.token.contextVariables;
this.flowContext.token = ct;
break;
case 102439:
case 135369224:
case 102406:
case 102412:
this.pushCount++;
this.vPush.addLast (ct);
case 135369225:
case 102410:
default:
this.flowContext =  new J.script.ScriptFlowContext (this, ct, pt, this.flowContext);
break;
}
}return true;
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "checkFlowEnd", 
($fz = function (tok, ident, pt1) {
if (this.flowContext == null || this.flowContext.token.tok != tok) {
var isOK = true;
switch (tok) {
case 135369225:
isOK = (this.flowContext.token.tok == 364547 || this.flowContext.token.tok == 102402);
break;
case 102410:
isOK = (this.flowContext.token.tok == 102411 || this.flowContext.token.tok == 102413);
break;
default:
isOK = false;
}
if (!isOK) return this.errorStr (1, "end " + ident);
}switch (tok) {
case 135369225:
case 102410:
break;
case 102412:
case 135369224:
case 102439:
case 102406:
this.vPush.remove (--this.pushCount);
break;
case 102436:
case 135368713:
case 364558:
if (!this.isCheckOnly) {
this.addTokenToPrefix (J.script.T.o (tok, this.thisFunction));
J.script.ScriptFunction.setFunction (this.thisFunction, this.script, pt1, this.lltoken.size (), this.lineNumbers, this.lineIndices, this.lltoken);
}this.thisFunction = (this.vFunctionStack.size () == 0 ? null : this.vFunctionStack.remove (0));
this.tokenCommand.intValue = 0;
if (tok == 364558) this.vPush.remove (--this.pushCount);
break;
default:
return this.errorStr (19, "end " + ident);
}
this.flowContext = this.flowContext.getParent ();
return true;
}, $fz.isPrivate = true, $fz), "~N,~S,~N");
$_M(c$, "getData", 
($fz = function (key) {
this.addTokenToPrefix (J.script.T.o (4, key));
this.ichToken += key.length + 2;
if (this.script.length > this.ichToken && this.script.charAt (this.ichToken) == '\r') {
this.lineCurrent++;
this.ichToken++;
}if (this.script.length > this.ichToken && this.script.charAt (this.ichToken) == '\n') {
this.lineCurrent++;
this.ichToken++;
}var i = this.script.indexOf (this.chFirst + key + this.chFirst, this.ichToken) - 4;
if (i < 0 || !this.script.substring (i, i + 4).equalsIgnoreCase ("END ")) return false;
var str = this.script.substring (this.ichToken, i);
this.incrementLineCount (str);
this.addTokenToPrefix (J.script.T.o (135270407, str));
this.addTokenToPrefix (J.script.T.o (1073741824, "end"));
this.addTokenToPrefix (J.script.T.o (4, key));
this.cchToken = i - this.ichToken + key.length + 6;
return true;
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "incrementLineCount", 
($fz = function (str) {
var ch;
var pt = str.indexOf ('\r');
var pt2 = str.indexOf ('\n');
if (pt < 0 && pt2 < 0) return 0;
var n = this.lineCurrent;
if (pt < 0 || pt2 < pt) pt = pt2;
for (var i = str.length; --i >= pt; ) {
if ((ch = str.charAt (i)) == '\n' || ch == '\r') this.lineCurrent++;
}
return this.lineCurrent - n;
}, $fz.isPrivate = true, $fz), "~S");
c$.isSpaceOrTab = $_M(c$, "isSpaceOrTab", 
($fz = function (ch) {
return ch == ' ' || ch == '\t';
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "eol", 
($fz = function (ch) {
return (ch == '\r' || ch == '\n' || ch == ';' && this.nSemiSkip <= 0);
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "lookingAtBraceSyntax", 
($fz = function () {
var ichT = this.ichToken;
var nParen = 1;
while (++ichT < this.cchScript && nParen > 0) {
switch (this.script.charAt (ichT)) {
case '{':
nParen++;
break;
case '}':
nParen--;
break;
}
}
if (ichT < this.cchScript && this.script.charAt (ichT) == '[' && ++nParen == 1) while (++ichT < this.cchScript && nParen > 0) {
switch (this.script.charAt (ichT)) {
case '[':
nParen++;
break;
case ']':
nParen--;
break;
}
}
if (ichT < this.cchScript && this.script.charAt (ichT) == '.' && nParen == 0) {
return true;
}return false;
}, $fz.isPrivate = true, $fz));
$_M(c$, "lookingAtString", 
($fz = function (allowPrime) {
if (this.ichToken == this.cchScript) return false;
this.chFirst = this.script.charAt (this.ichToken);
if (this.chFirst != '"' && (!allowPrime || this.chFirst != '\'')) return false;
var ichT = this.ichToken;
var ch;
var previousCharBackslash = false;
while (++ichT < this.cchScript) {
ch = this.script.charAt (ichT);
if (ch == this.chFirst && !previousCharBackslash) break;
previousCharBackslash = (ch == '\\' ? !previousCharBackslash : false);
}
if (ichT == this.cchScript) {
this.cchToken = -1;
this.ichEnd = this.cchScript;
} else {
this.cchToken = ++ichT - this.ichToken;
}return true;
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "getUnescapedStringLiteral", 
function () {
if (this.cchToken < 2) return "";
var sb = J.util.SB.newN (this.cchToken - 2);
var ichMax = this.ichToken + this.cchToken - 1;
var ich = this.ichToken + 1;
while (ich < ichMax) {
var ch = this.script.charAt (ich++);
if (ch == '\\' && ich < ichMax) {
ch = this.script.charAt (ich++);
switch (ch) {
case 'b':
ch = '\b';
break;
case 'n':
ch = '\n';
break;
case 't':
ch = '\t';
break;
case 'r':
ch = '\r';
case '"':
case '\\':
case '\'':
break;
case 'x':
case 'u':
var digitCount = ch == 'x' ? 2 : 4;
if (ich < ichMax) {
var unicode = 0;
for (var k = digitCount; --k >= 0 && ich < ichMax; ) {
var chT = this.script.charAt (ich);
var hexit = J.util.Escape.getHexitValue (chT);
if (hexit < 0) break;
unicode <<= 4;
unicode += hexit;
++ich;
}
ch = String.fromCharCode (unicode);
}}
}sb.appendC (ch);
}
return sb.toString ();
});
$_M(c$, "lookingAtLoadFormat", 
($fz = function () {
var ichT = this.ichToken;
var ch = '\u0000';
var allchar = (ichT < this.cchScript && J.viewer.Viewer.isDatabaseCode (ch = this.script.charAt (ichT)));
while (ichT < this.cchScript && (Character.isLetterOrDigit (ch = this.script.charAt (ichT)) && (allchar || Character.isLetter (ch)) || allchar && (!this.eol (ch) && !Character.isWhitespace (ch)))) ++ichT;

if (!allchar && ichT == this.ichToken || !J.script.ScriptCompiler.isSpaceOrTab (ch)) return false;
this.cchToken = ichT - this.ichToken;
return true;
}, $fz.isPrivate = true, $fz));
$_M(c$, "lookingAtImpliedString", 
($fz = function (allowSpace, allowEquals, allowSptParen) {
var ichT = this.ichToken;
var ch = this.script.charAt (ichT);
var parseVariables = !(J.script.T.tokAttr (this.tokCommand, 20480) || (this.tokCommand & 1) == 0);
var isVariable = (ch == '@');
var isMath = (isVariable && ichT + 3 < this.cchScript && this.script.charAt (ichT + 1) == '{');
if (isMath && parseVariables) {
ichT = J.util.TextFormat.ichMathTerminator (this.script, this.ichToken + 1, this.cchScript);
return (ichT != this.cchScript && (this.cchToken = ichT + 1 - this.ichToken) > 0);
}var ptSpace = -1;
var ptLastChar = -1;
var isOK = true;
var parenpt = 0;
while (isOK && ichT < this.cchScript && !this.eol (ch = this.script.charAt (ichT))) {
switch (ch) {
case '(':
if (!allowSptParen) {
if (ichT >= 5 && (this.script.substring (ichT - 4, ichT).equals (".spt") || this.script.substring (ichT - 4, ichT).equals (".png") || this.script.substring (ichT - 5, ichT).equals (".pngj"))) {
isOK = false;
continue;
}}break;
case '=':
if (!allowEquals) {
isOK = false;
continue;
}break;
case '{':
parenpt++;
break;
case '}':
parenpt--;
if (parenpt < 0 && (this.braceCount > 0 || this.iBrace > 0)) {
isOK = false;
continue;
}break;
default:
if (Character.isWhitespace (ch)) {
if (ptSpace < 0) ptSpace = ichT;
} else {
ptLastChar = ichT;
}break;
}
if (Character.isWhitespace (ch)) {
if (ptSpace < 0) ptSpace = ichT;
} else {
ptLastChar = ichT;
}++ichT;
}
if (allowSpace) ichT = ptLastChar + 1;
 else if (ptSpace > 0) ichT = ptSpace;
if (isVariable && ptSpace < 0 && parenpt <= 0 && ichT - this.ichToken > 1) {
return false;
}return (this.cchToken = ichT - this.ichToken) > 0;
}, $fz.isPrivate = true, $fz), "~B,~B,~B");
$_M(c$, "lookingAtExponential", 
($fz = function () {
if (this.ichToken == this.cchScript) return NaN;
var ichT = this.ichToken;
var pt0 = ichT;
if (this.script.charAt (ichT) == '-') ++ichT;
var isOK = false;
var ch = 'X';
while (ichT < this.cchScript && Character.isDigit (ch = this.script.charAt (ichT))) {
++ichT;
isOK = true;
}
if (ichT < this.cchScript && ch == '.') ++ichT;
while (ichT < this.cchScript && Character.isDigit (ch = this.script.charAt (ichT))) {
++ichT;
isOK = true;
}
if (ichT == this.cchScript || !isOK) return NaN;
isOK = (ch != 'E' && ch != 'e');
if (isOK || ++ichT == this.cchScript) return NaN;
ch = this.script.charAt (ichT);
if (ch == '-' || ch == '+') ichT++;
while (ichT < this.cchScript && Character.isDigit (ch = this.script.charAt (ichT))) {
ichT++;
isOK = true;
}
if (!isOK) return NaN;
this.cchToken = ichT - this.ichToken;
return J.util.Parser.dVal (this.script.substring (pt0, ichT));
}, $fz.isPrivate = true, $fz));
$_M(c$, "lookingAtDecimal", 
($fz = function () {
if (this.ichToken == this.cchScript) return false;
var ichT = this.ichToken;
if (this.script.charAt (ichT) == '-') ++ichT;
var digitSeen = false;
var ch = 'X';
while (ichT < this.cchScript && Character.isDigit (ch = this.script.charAt (ichT++))) digitSeen = true;

if (ch != '.') return false;
var ch1;
if (ichT < this.cchScript && !this.eol (ch1 = this.script.charAt (ichT))) {
if (Character.isLetter (ch1) || ch1 == '?' || ch1 == '*') return false;
if (ichT + 1 < this.cchScript && (Character.isLetter (ch1 = this.script.charAt (ichT + 1)) || ch1 == '?')) return false;
}while (ichT < this.cchScript && Character.isDigit (this.script.charAt (ichT))) {
++ichT;
digitSeen = true;
}
this.cchToken = ichT - this.ichToken;
return digitSeen;
}, $fz.isPrivate = true, $fz));
$_M(c$, "lookingAtSeqcode", 
($fz = function () {
var ichT = this.ichToken;
var ch = ' ';
if (ichT + 1 < this.cchScript && this.script.charAt (ichT) == '*' && this.script.charAt (ichT + 1) == '^') {
ch = '^';
++ichT;
} else {
if (this.script.charAt (ichT) == '-') ++ichT;
while (ichT < this.cchScript && Character.isDigit (ch = this.script.charAt (ichT))) ++ichT;

}if (ch != '^') return false;
ichT++;
if (ichT == this.cchScript) ch = ' ';
 else ch = this.script.charAt (ichT++);
if (ch != ' ' && ch != '*' && ch != '?' && !Character.isLetter (ch)) return false;
this.cchToken = ichT - this.ichToken;
return true;
}, $fz.isPrivate = true, $fz));
$_M(c$, "lookingAtInteger", 
($fz = function () {
if (this.ichToken == this.cchScript) return 2147483647;
var ichT = this.ichToken;
if (this.script.charAt (this.ichToken) == '-') ++ichT;
var ichBeginDigits = ichT;
while (ichT < this.cchScript && Character.isDigit (this.script.charAt (ichT))) ++ichT;

if (ichBeginDigits == ichT) return 2147483647;
this.cchToken = ichT - this.ichToken;
try {
var val = Integer.parseInt (this.script.substring (this.ichToken, ichT));
return val;
} catch (e) {
if (Clazz.exceptionOf (e, NumberFormatException)) {
} else {
throw e;
}
}
return 2147483647;
}, $fz.isPrivate = true, $fz));
$_M(c$, "lookingAtBitset", 
function () {
if (this.script.indexOf ("({null})", this.ichToken) == this.ichToken) {
this.cchToken = 8;
return  new J.util.BS ();
}var ichT;
if (this.ichToken + 4 > this.cchScript || this.script.charAt (this.ichToken + 1) != '{' || (ichT = this.script.indexOf ("}", this.ichToken)) < 0 || ichT + 1 == this.cchScript) return null;
var bs = J.util.Escape.uB (this.script.substring (this.ichToken, ichT + 2));
if (bs != null) this.cchToken = ichT + 2 - this.ichToken;
return bs;
});
$_M(c$, "lookingAtObjectID", 
($fz = function (allowWildID) {
var ichT = this.ichToken;
if (ichT == this.cchScript || this.script.charAt (ichT) != '$') return false;
if (++ichT != this.cchScript && this.script.charAt (ichT) == '"') return false;
while (ichT < this.cchScript) {
var ch;
if (Character.isWhitespace (ch = this.script.charAt (ichT))) {
if (ichT == this.ichToken + 1) return false;
break;
}if (!Character.isLetterOrDigit (ch)) {
switch (ch) {
default:
return false;
case '*':
if (!allowWildID) return false;
break;
case '~':
case '_':
break;
}
}ichT++;
}
this.cchToken = ichT - (++this.ichToken);
return true;
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "lookingAtLookupToken", 
($fz = function (ichT) {
if (ichT == this.cchScript) return false;
var ichT0 = ichT;
this.tokLastMath = 0;
var ch;
switch (ch = this.script.charAt (ichT++)) {
case '-':
case '+':
case '&':
case '|':
case '*':
if (ichT < this.cchScript) {
if (this.script.charAt (ichT) == ch) {
++ichT;
if (ch == '-' || ch == '+') break;
if (ch == '&' && ichT < this.cchScript && this.script.charAt (ichT) == ch) ++ichT;
} else if (this.script.charAt (ichT) == '=') {
++ichT;
}}this.tokLastMath = 1;
break;
case '/':
if (ichT < this.cchScript && this.script.charAt (ichT) == '/') break;
case '\\':
case '!':
if (ichT < this.cchScript && this.script.charAt (ichT) == '=') ++ichT;
this.tokLastMath = 1;
break;
case ')':
case ']':
case '}':
case '.':
break;
case '@':
case '{':
this.tokLastMath = 2;
break;
case ':':
this.tokLastMath = 1;
break;
case '(':
case ',':
case '$':
case ';':
case '[':
case '%':
this.tokLastMath = 1;
break;
case '<':
case '=':
case '>':
if (ichT < this.cchScript && ((ch = this.script.charAt (ichT)) == '<' || ch == '=' || ch == '>')) ++ichT;
this.tokLastMath = 1;
break;
default:
if (!Character.isLetter (ch)) return false;
case '~':
case '_':
case '\'':
case '?':
if (ch == '?') this.tokLastMath = 1;
while (ichT < this.cchScript && (Character.isLetterOrDigit (ch = this.script.charAt (ichT)) || ch == '_' || ch == '?' || ch == '~' || ch == '\'') || (ch == '^' && ichT > ichT0 && Character.isDigit (this.script.charAt (ichT - 1))) || ch == '\\' && ichT + 1 < this.cchScript && this.script.charAt (ichT + 1) == '?') ++ichT;

break;
}
this.cchToken = ichT - ichT0;
return true;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "charToken", 
($fz = function () {
var ch;
if (this.ichToken == this.cchScript || (ch = this.script.charAt (this.ichToken)) == '"' || ch == '@') return false;
var ichT = this.ichToken;
while (ichT < this.cchScript && !J.script.ScriptCompiler.isSpaceOrTab (ch = this.script.charAt (ichT)) && ch != '#' && ch != '}' && !this.eol (ch)) ++ichT;

this.cchToken = ichT - this.ichToken;
return true;
}, $fz.isPrivate = true, $fz));
$_M(c$, "ERROR", 
($fz = function (error) {
this.errorIntStr2 (error, null, null);
return 4;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "ERROR", 
($fz = function (error, value) {
this.errorStr (error, value);
return 4;
}, $fz.isPrivate = true, $fz), "~N,~S");
$_M(c$, "handleError", 
($fz = function () {
this.errorType = this.errorMessage;
this.errorLine = this.script.substring (this.ichCurrentCommand, this.ichEnd <= this.ichCurrentCommand ? this.ichToken : this.ichEnd);
var lineInfo = (this.ichToken < this.ichEnd ? this.errorLine.substring (0, this.ichToken - this.ichCurrentCommand) + " >>>> " + this.errorLine.substring (this.ichToken - this.ichCurrentCommand) : this.errorLine) + " <<<<";
this.errorMessage = J.i18n.GT._ ("script compiler ERROR: ") + this.errorMessage + J.script.ScriptEvaluator.setErrorLineMessage (null, this.filename, this.lineCurrent, this.iCommand, lineInfo);
if (!this.isSilent) {
this.ichToken = Math.max (this.ichEnd, this.ichToken);
while (!this.lookingAtEndOfLine () && !this.lookingAtEndOfStatement ()) this.ichToken++;

this.errorLine = this.script.substring (this.ichCurrentCommand, this.ichToken);
this.viewer.addCommand (this.errorLine + "#??");
J.util.Logger.error (this.errorMessage);
}return false;
}, $fz.isPrivate = true, $fz));
Clazz.defineStatics (c$,
"OK", 0,
"OK2", 1,
"CONTINUE", 2,
"EOL", 3,
"$ERROR", 4);
});
// 
//// J\script\ScriptCompilationTokenParser.js 
// 
Clazz.declarePackage ("J.script");
Clazz.load (null, "J.script.ScriptCompilationTokenParser", ["java.lang.Float", "J.i18n.GT", "J.script.ScriptEvaluator", "$.T", "J.util.JmolList", "$.Logger", "$.P3", "$.TextFormat", "J.viewer.JC"], function () {
c$ = Clazz.decorateAsClass (function () {
this.viewer = null;
this.script = null;
this.isStateScript = false;
this.lineCurrent = 0;
this.iCommand = 0;
this.ichCurrentCommand = 0;
this.ichComment = 0;
this.ichEnd = 0;
this.ichToken = 0;
this.theToken = null;
this.lastFlowCommand = null;
this.tokenCommand = null;
this.lastToken = null;
this.tokenAndEquals = null;
this.theTok = 0;
this.nTokens = 0;
this.tokCommand = 0;
this.ptNewSetModifier = 0;
this.isNewSet = false;
this.logMessages = false;
this.atokenInfix = null;
this.itokenInfix = 0;
this.isSetBrace = false;
this.isMathExpressionCommand = false;
this.isSetOrDefine = false;
this.ltokenPostfix = null;
this.isEmbeddedExpression = false;
this.isCommaAsOrAllowed = false;
this.theValue = null;
this.htUserFunctions = null;
this.haveString = false;
this.residueSpecCodeGenerated = false;
this.errorMessage = null;
this.errorMessageUntranslated = null;
this.errorLine = null;
this.errorType = null;
Clazz.instantialize (this, arguments);
}, J.script, "ScriptCompilationTokenParser");
$_M(c$, "compileExpressions", 
function () {
var isScriptExpression = (this.tokCommand == 135271429 && this.tokAt (2) == 269484048);
this.isEmbeddedExpression = isScriptExpression || (this.tokCommand != 0 && (this.tokCommand != 135368713 && this.tokCommand != 102436 && this.tokCommand != 364558 && this.tokCommand != 102412 || this.tokenCommand.intValue != 2147483647) && this.tokCommand != 1150985 && !J.script.T.tokAttrOr (this.tokCommand, 12288, 20480));
this.isMathExpressionCommand = (this.tokCommand == 1073741824 || isScriptExpression || J.script.T.tokAttr (this.tokCommand, 36864));
var checkExpression = this.isEmbeddedExpression || (J.script.T.tokAttr (this.tokCommand, 12288));
if (this.tokAt (1) == 1048583 && J.script.T.tokAttr (this.tokCommand, 12288)) checkExpression = false;
if (checkExpression && !this.compileExpression ()) return false;
var size = this.atokenInfix.length;
var nDefined = 0;
for (var i = 1; i < size; i++) {
if (this.tokAt (i) == 1060866) nDefined++;
}
size -= nDefined;
if (this.isNewSet) {
if (size == 1) {
this.atokenInfix[0] = J.script.T.tv (135368713, 0, this.atokenInfix[0].value);
this.isNewSet = false;
}}if ((this.isNewSet || this.isSetBrace) && size < this.ptNewSetModifier + 2) return this.commandExpected ();
return (size == 1 || !J.script.T.tokAttr (this.tokCommand, 262144) ? true : this.error (0));
});
$_M(c$, "compileExpression", 
function () {
var firstToken = (this.isSetOrDefine && !this.isSetBrace ? 2 : 1);
this.ltokenPostfix =  new J.util.JmolList ();
this.itokenInfix = 0;
var tokenBegin = null;
var tok = this.tokAt (1);
switch (this.tokCommand) {
case 1060866:
if (this.tokAt (1) == 2 && this.tokAt (2) == 1048584 && this.tokAt (4) == 269484436) {
this.tokCommand = 1085443;
this.isSetBrace = true;
this.ptNewSetModifier = 4;
this.isMathExpressionCommand = true;
this.isEmbeddedExpression = true;
this.addTokenToPostfixToken (J.script.T.tokenSetProperty);
this.addTokenToPostfixToken (J.script.T.tokenExpressionBegin);
this.addNextToken ();
this.addNextToken ();
this.addTokenToPostfixToken (J.script.T.tokenExpressionEnd);
firstToken = 0;
}break;
case 12295:
if (tok == 1678770178) firstToken = 2;
break;
case 12294:
case 1610625028:
case 135280132:
switch (tok) {
case 1276118017:
case 1073742119:
firstToken = 2;
tok = this.tokAt (2);
break;
}
if (tok == 1087373318) firstToken++;
}
for (var i = 0; i < firstToken && this.addNextToken (); i++) {
}
while (this.moreTokens ()) {
if (this.isEmbeddedExpression) {
while (!this.isExpressionNext ()) {
if (this.tokPeekIs (1073741824) && !(this.tokCommand == 135271426 && this.itokenInfix == 1)) {
var name = this.atokenInfix[this.itokenInfix].value;
var t = J.script.T.getTokenFromName (name);
if (t != null) if (!this.isMathExpressionCommand && this.lastToken.tok != 1060866 || (this.lastToken.tok == 1048584 || this.tokAt (this.itokenInfix + 1) == 269484048) && !this.isUserFunction (name)) {
this.atokenInfix[this.itokenInfix] = t;
}}if (!this.addNextToken ()) break;
}
if (!this.moreTokens ()) break;
}if (this.lastToken.tok == 1060866) {
if (!this.clauseDefine (true, false)) return false;
continue;
}if (!this.isMathExpressionCommand) this.addTokenToPostfixToken (tokenBegin = J.script.T.o (1048577, "implicitExpressionBegin"));
if (!this.clauseOr (this.isCommaAsOrAllowed || !this.isMathExpressionCommand && this.tokPeekIs (269484048))) return false;
if (!this.isMathExpressionCommand && !(this.isEmbeddedExpression && this.lastToken === J.script.T.tokenCoordinateEnd)) {
this.addTokenToPostfixToken (J.script.T.tokenExpressionEnd);
}if (this.moreTokens ()) {
if (this.tokCommand != 135280132 && !this.isEmbeddedExpression) return this.error (5);
if (this.tokCommand == 135280132) {
tokenBegin.intValue = 0;
this.tokCommand = 0;
this.isEmbeddedExpression = true;
this.isMathExpressionCommand = true;
this.isCommaAsOrAllowed = false;
}}}
this.atokenInfix = this.ltokenPostfix.toArray ( new Array (this.ltokenPostfix.size ()));
return true;
});
$_M(c$, "isUserFunction", 
function (name) {
return (!this.isStateScript && (this.viewer.isFunction (name) || this.htUserFunctions.containsKey (name)));
}, "~S");
$_M(c$, "isExpressionNext", 
($fz = function () {
return this.tokPeekIs (1048586) && !(this.tokAt (this.itokenInfix + 1) == 4 && this.tokAt (this.itokenInfix + 2) == 269484066) || !this.isMathExpressionCommand && this.tokPeekIs (269484048);
}, $fz.isPrivate = true, $fz));
c$.tokenAttr = $_M(c$, "tokenAttr", 
function (token, tok) {
return token != null && J.script.T.tokAttr (token.tok, tok);
}, "J.script.T,~N");
$_M(c$, "moreTokens", 
($fz = function () {
return (this.itokenInfix < this.atokenInfix.length);
}, $fz.isPrivate = true, $fz));
$_M(c$, "tokAt", 
function (i) {
return (i < this.atokenInfix.length ? this.atokenInfix[i].tok : 0);
}, "~N");
$_M(c$, "tokPeek", 
($fz = function () {
return (this.itokenInfix >= this.atokenInfix.length ? 0 : this.atokenInfix[this.itokenInfix].tok);
}, $fz.isPrivate = true, $fz));
$_M(c$, "tokPeekIs", 
($fz = function (tok) {
return (this.tokAt (this.itokenInfix) == tok);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "intPeek", 
($fz = function () {
return (this.itokenInfix >= this.atokenInfix.length ? 2147483647 : this.atokenInfix[this.itokenInfix].intValue);
}, $fz.isPrivate = true, $fz));
$_M(c$, "valuePeek", 
($fz = function () {
return (this.moreTokens () ? this.atokenInfix[this.itokenInfix].value : "");
}, $fz.isPrivate = true, $fz));
$_M(c$, "tokenNext", 
($fz = function () {
return (this.itokenInfix >= this.atokenInfix.length ? null : this.atokenInfix[this.itokenInfix++]);
}, $fz.isPrivate = true, $fz));
$_M(c$, "tokenNextTok", 
($fz = function (tok) {
var token = this.tokenNext ();
return (token != null && token.tok == tok);
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "returnToken", 
($fz = function () {
this.itokenInfix--;
return false;
}, $fz.isPrivate = true, $fz));
$_M(c$, "getToken", 
($fz = function () {
this.theValue = ((this.theToken = this.tokenNext ()) == null ? null : this.theToken.value);
return this.theToken;
}, $fz.isPrivate = true, $fz));
$_M(c$, "isToken", 
($fz = function (tok) {
return this.theToken != null && this.theToken.tok == tok;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "getNumericalToken", 
($fz = function () {
return (this.getToken () != null && (this.isToken (2) || this.isToken (3)));
}, $fz.isPrivate = true, $fz));
$_M(c$, "floatValue", 
($fz = function () {
switch (this.theToken.tok) {
case 2:
return this.theToken.intValue;
case 3:
return (this.theValue).floatValue ();
}
return 0;
}, $fz.isPrivate = true, $fz));
$_M(c$, "addTokenToPostfix", 
($fz = function (tok, value) {
return this.addTokenToPostfixToken (J.script.T.o (tok, value));
}, $fz.isPrivate = true, $fz), "~N,~O");
$_M(c$, "addTokenToPostfixInt", 
($fz = function (tok, intValue, value) {
return this.addTokenToPostfixToken (J.script.T.tv (tok, intValue, value));
}, $fz.isPrivate = true, $fz), "~N,~N,~O");
$_M(c$, "addTokenToPostfixToken", 
($fz = function (token) {
if (token == null) return false;
if (this.logMessages) J.util.Logger.info ("addTokenToPostfix" + token);
this.ltokenPostfix.addLast (token);
this.lastToken = token;
return true;
}, $fz.isPrivate = true, $fz), "J.script.T");
$_M(c$, "addNextToken", 
($fz = function () {
return this.addTokenToPostfixToken (this.tokenNext ());
}, $fz.isPrivate = true, $fz));
$_M(c$, "addNextTokenIf", 
($fz = function (tok) {
return (this.tokPeekIs (tok) && this.addNextToken ());
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "addSubstituteTokenIf", 
($fz = function (tok, token) {
if (!this.tokPeekIs (tok)) return false;
this.itokenInfix++;
return this.addTokenToPostfixToken (token);
}, $fz.isPrivate = true, $fz), "~N,J.script.T");
$_M(c$, "clauseOr", 
($fz = function (allowComma) {
this.haveString = false;
if (!this.clauseAnd ()) return false;
if (this.isEmbeddedExpression && this.lastToken.tok == 1048578) return true;
var tok;
while ((tok = this.tokPeek ()) == 269484112 || tok == 269484113 || tok == 269484114 || allowComma && tok == 269484080) {
if (tok == 269484080 && !this.haveString) this.addSubstituteTokenIf (269484080, J.script.T.tokenOr);
 else this.addNextToken ();
if (!this.clauseAnd ()) return false;
if (allowComma && (this.lastToken.tok == 1048590 || this.lastToken.tok == 10)) this.haveString = true;
}
return true;
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "clauseAnd", 
($fz = function () {
if (!this.clauseNot ()) return false;
if (this.isEmbeddedExpression && this.lastToken.tok == 1048578) return true;
while (this.tokPeekIs (269484128)) {
this.addNextToken ();
if (!this.clauseNot ()) return false;
}
return true;
}, $fz.isPrivate = true, $fz));
$_M(c$, "clauseNot", 
($fz = function () {
if (this.tokPeekIs (269484144)) {
this.addNextToken ();
return this.clauseNot ();
}return (this.clausePrimitive ());
}, $fz.isPrivate = true, $fz));
$_M(c$, "clausePrimitive", 
($fz = function () {
var tok = this.tokPeek ();
switch (tok) {
case 1073742195:
this.itokenInfix++;
return this.clausePrimitive ();
case 0:
return this.error (4);
case 1048579:
case 10:
case 269484208:
case 137363468:
case 3145736:
case 3145735:
case 3145738:
case 1048585:
case 1048587:
case 3145760:
return this.addNextToken ();
case 4:
this.haveString = true;
return this.addNextToken ();
case 3:
return this.addTokenToPostfixInt (1048611, this.fixModelSpec (this.getToken ()), this.theValue);
case 1095761925:
return this.clauseCell ();
case 135266310:
return this.clauseConnected ();
case 135267335:
case 135267336:
return this.clauseSubstructure ();
case 135266324:
case 135402505:
return this.clauseWithin (tok == 135266324);
case 1060866:
return this.clauseDefine (false, false);
case 1678770178:
case 1746538509:
this.addNextToken ();
if (this.tokPeekIs (10)) this.addNextToken ();
 else if (this.tokPeekIs (1060866)) return this.clauseDefine (false, false);
return true;
case 269484048:
this.addNextToken ();
if (!this.clauseOr (true)) return false;
if (!this.addNextTokenIf (269484049)) return this.errorStr (15, ")");
return this.checkForItemSelector (true);
case 1048586:
return this.checkForCoordinate (this.isMathExpressionCommand);
default:
if (this.clauseResidueSpec ()) return true;
if (this.isError ()) return false;
if (J.script.T.tokAttr (tok, 1078984704)) {
var itemp = this.itokenInfix;
var isOK = this.clauseComparator (true);
if (isOK || this.itokenInfix != itemp) return isOK;
if (tok == 1238369286) {
return this.clauseSubstructure ();
}}return this.addNextToken ();
}
}, $fz.isPrivate = true, $fz));
$_M(c$, "checkForCoordinate", 
($fz = function (isImplicitExpression) {
var isCoordinate = false;
var pt = this.ltokenPostfix.size ();
if (isImplicitExpression) {
this.addTokenToPostfixToken (J.script.T.tokenExpressionBegin);
this.tokenNext ();
} else if (this.isEmbeddedExpression) {
this.tokenNext ();
pt--;
} else {
this.addNextToken ();
}var isHash = this.tokPeekIs (4);
if (isHash) {
isImplicitExpression = false;
this.returnToken ();
this.ltokenPostfix.remove (this.ltokenPostfix.size () - 1);
this.addNextToken ();
var nBrace = 1;
while (nBrace != 0) {
if (this.tokPeekIs (1048586)) {
if (this.isExpressionNext ()) {
this.addTokenToPostfixToken (J.script.T.o (1048577, "implicitExpressionBegin"));
if (!this.clauseOr (true)) return false;
if (this.lastToken !== J.script.T.tokenCoordinateEnd) {
this.addTokenToPostfixToken (J.script.T.tokenExpressionEnd);
}} else {
nBrace++;
}}if (this.tokPeekIs (1048590)) nBrace--;
this.addNextToken ();
}
} else {
if (!this.tokPeekIs (1048590) && !this.clauseOr (false)) return false;
var n = 1;
while (!this.tokPeekIs (1048590)) {
var haveComma = this.addNextTokenIf (269484080);
if (!this.clauseOr (false)) return (haveComma || n < 3 ? false : this.errorStr (15, "}"));
n++;
}
isCoordinate = (n >= 2);
}if (isCoordinate && (isImplicitExpression || this.isEmbeddedExpression)) {
this.ltokenPostfix.set (pt, J.script.T.tokenCoordinateBegin);
this.addTokenToPostfixToken (J.script.T.tokenCoordinateEnd);
this.tokenNext ();
} else if (isImplicitExpression) {
this.addTokenToPostfixToken (J.script.T.tokenExpressionEnd);
this.tokenNext ();
} else if (this.isEmbeddedExpression && !isHash) {
this.tokenNext ();
} else {
this.addNextToken ();
}return this.checkForItemSelector (!isHash);
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "checkForItemSelector", 
($fz = function (allowNumeric) {
var tok;
if ((tok = this.tokAt (this.itokenInfix + 1)) == 269484096 || allowNumeric && tok == 1048586) return true;
while (true) {
if (!this.addNextTokenIf (269484096)) break;
if (!this.clauseItemSelector ()) return false;
if (!this.addNextTokenIf (269484097)) return this.errorStr (15, "]");
}
return true;
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "clauseWithin", 
($fz = function (isWithin) {
this.addNextToken ();
if (!this.addNextTokenIf (269484048)) return false;
if (this.getToken () == null) return false;
var distance = 3.4028235E38;
var key = null;
var allowComma = isWithin;
var tok;
var tok0 = this.theToken.tok;
if (!isWithin) {
tok = -1;
for (var i = this.itokenInfix; tok != 0; i++) {
switch (tok = this.tokAt (i)) {
case 269484080:
tok = 0;
break;
case 1048586:
case 269484048:
case 269484049:
distance = 100;
this.returnToken ();
tok0 = tok = 0;
break;
}
}
}switch (tok0) {
case 269484192:
if (this.getToken () == null) return false;
if (this.theToken.tok != 2) return this.error (12);
distance = -this.theToken.intValue;
break;
case 2:
case 3:
distance = this.floatValue ();
break;
case 1060866:
this.addTokenToPostfixToken (this.theToken);
if (!this.clauseDefine (true, false)) return false;
key = "";
allowComma = false;
break;
}
if (isWithin && distance == 3.4028235E38) switch (tok0) {
case 1060866:
break;
case 135267335:
case 135267336:
case 1238369286:
this.addTokenToPostfix (4, this.theValue);
if (!this.addNextTokenIf (269484080)) return false;
allowComma = false;
tok = this.tokPeek ();
switch (tok) {
case 0:
return false;
case 4:
this.addNextToken ();
key = "";
break;
case 1060866:
if (!this.clauseDefine (false, true)) return false;
key = "";
break;
default:
return false;
}
break;
case 1048580:
allowComma = false;
case 1087375361:
case 1087375362:
case 1073741864:
case 1679429641:
case 1087373316:
case 1048582:
case 1087375365:
case 1087373318:
case 137363468:
case 1095766028:
case 1095761934:
case 135266319:
case 135267841:
case 1095761935:
case 1087373320:
case 3145760:
case 1095761938:
case 1641025539:
case 4:
case 1649412112:
key = this.theValue;
break;
case 1073741824:
key = (this.theValue).toLowerCase ();
break;
default:
return this.errorIntStr2 (18, "WITHIN", ": " + this.theToken.value);
}
if (key == null) this.addTokenToPostfix (3, Float.$valueOf (distance));
 else if (key.length > 0) this.addTokenToPostfix (4, key);
var done = false;
while (!done) {
if (tok0 != 0 && !this.addNextTokenIf (269484080)) break;
if (tok0 == 0) tok0 = 135402505;
var isCoordOrPlane = false;
tok = this.tokPeek ();
if (isWithin) {
switch (tok0) {
case 2:
case 3:
if (tok == 1048589 || tok == 1048588) {
this.addTokenToPostfixToken (this.getToken ());
if (!this.addNextTokenIf (269484080)) break;
tok = this.tokPeek ();
}break;
}
if (key == null) {
switch (tok) {
case 135267841:
case 1048582:
case 135266319:
isCoordOrPlane = true;
this.addNextToken ();
break;
case 1048583:
this.getToken ();
this.getToken ();
this.addTokenToPostfix (4, "$" + this.theValue);
done = true;
break;
case 1087373318:
case 1649412112:
this.getToken ();
this.addTokenToPostfix (4, J.script.T.nameOf (tok));
break;
case 1048586:
this.returnToken ();
isCoordOrPlane = true;
this.addTokenToPostfixToken (J.script.T.getTokenFromName (distance == 3.4028235E38 ? "plane" : "coord"));
}
if (!done) this.addNextTokenIf (269484080);
}}tok = this.tokPeek ();
if (done) break;
if (isCoordOrPlane) {
while (!this.tokPeekIs (269484049)) {
switch (this.tokPeek ()) {
case 0:
return this.error (4);
case 269484048:
this.addTokenToPostfixToken (J.script.T.tokenExpressionBegin);
this.addNextToken ();
if (!this.clauseOr (false)) return this.errorIntStr2 (18, "WITHIN", ": ?");
if (!this.addNextTokenIf (269484049)) return this.errorStr (15, ", / )");
this.addTokenToPostfixToken (J.script.T.tokenExpressionEnd);
break;
case 1060866:
if (!this.clauseDefine (false, false)) return false;
break;
default:
this.addTokenToPostfixToken (this.getToken ());
}
}
} else if (!this.clauseOr (allowComma)) {
}}
if (!this.addNextTokenIf (269484049)) return this.errorStr (15, ")");
return true;
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "clauseConnected", 
($fz = function () {
this.addNextToken ();
if (!this.addNextTokenIf (269484048)) {
this.addTokenToPostfixToken (J.script.T.tokenLeftParen);
this.addTokenToPostfixToken (J.script.T.tokenRightParen);
return true;
}while (true) {
if (this.addNextTokenIf (2)) if (!this.addNextTokenIf (269484080)) break;
if (this.addNextTokenIf (2)) if (!this.addNextTokenIf (269484080)) break;
if (this.addNextTokenIf (3)) if (!this.addNextTokenIf (269484080)) break;
if (this.addNextTokenIf (3)) if (!this.addNextTokenIf (269484080)) break;
var strOrder = this.getToken ().value;
var intType = J.script.ScriptEvaluator.getBondOrderFromString (strOrder);
if (intType == 131071) {
this.returnToken ();
} else {
this.addTokenToPostfix (4, strOrder);
if (!this.addNextTokenIf (269484080)) break;
}if (this.addNextTokenIf (269484049)) return true;
if (!this.clauseOr (this.tokPeekIs (269484048))) return false;
if (this.addNextTokenIf (269484049)) return true;
if (!this.addNextTokenIf (269484080)) return false;
if (!this.clauseOr (this.tokPeekIs (269484048))) return false;
break;
}
if (!this.addNextTokenIf (269484049)) return this.errorStr (15, ")");
return true;
}, $fz.isPrivate = true, $fz));
$_M(c$, "clauseSubstructure", 
($fz = function () {
this.addNextToken ();
if (!this.addNextTokenIf (269484048)) return false;
if (this.tokPeekIs (1060866)) {
if (!this.clauseDefine (false, true)) return false;
} else if (!this.addNextTokenIf (4)) {
return this.errorStr (15, "\"...\"");
}if (this.addNextTokenIf (269484080)) if (!this.clauseOr (this.tokPeekIs (269484048))) return false;
if (!this.addNextTokenIf (269484049)) return this.errorStr (15, ")");
return true;
}, $fz.isPrivate = true, $fz));
$_M(c$, "clauseItemSelector", 
($fz = function () {
var tok;
var nparen = 0;
while ((tok = this.tokPeek ()) != 0 && tok != 269484097) {
this.addNextToken ();
if (tok == 269484096) nparen++;
if (this.tokPeek () == 269484097 && nparen-- > 0) this.addNextToken ();
}
return true;
}, $fz.isPrivate = true, $fz));
$_M(c$, "clauseComparator", 
($fz = function (isOptional) {
var tokenAtomProperty = this.tokenNext ();
var tokenComparator = this.tokenNext ();
if (!J.script.ScriptCompilationTokenParser.tokenAttr (tokenComparator, 269484288)) {
if (!isOptional) return this.errorStr (15, "== != < > <= >=");
if (tokenComparator != null) this.returnToken ();
this.returnToken ();
return false;
}if (J.script.ScriptCompilationTokenParser.tokenAttr (tokenAtomProperty, 1087373312) && tokenComparator.tok != 269484436 && tokenComparator.tok != 269484438) return this.errorStr (15, "== !=");
if (this.getToken () == null) return this.errorStr (17, "" + this.valuePeek ());
var isNegative = (this.isToken (269484192));
if (isNegative && this.getToken () == null) return this.error (12);
switch (this.theToken.tok) {
case 2:
case 3:
case 1073741824:
case 4:
case 1048586:
case 1060866:
break;
default:
if (!J.script.T.tokAttr (this.theToken.tok, 1073741824)) return this.error (13);
}
this.addTokenToPostfixInt (tokenComparator.tok, tokenAtomProperty.tok, tokenComparator.value + (isNegative ? " -" : ""));
if (tokenAtomProperty.tok == 1716520973) this.addTokenToPostfixToken (tokenAtomProperty);
if (this.isToken (1048586)) {
this.returnToken ();
return this.clausePrimitive ();
}this.addTokenToPostfixToken (this.theToken);
if (this.theToken.tok == 1060866) return this.clauseDefine (true, false);
return true;
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "clauseCell", 
($fz = function () {
var cell =  new J.util.P3 ();
this.tokenNext ();
if (!this.tokenNextTok (269484436)) return this.errorStr (15, "=");
if (this.getToken () == null) return this.error (3);
if (this.isToken (2)) {
var nnn = this.theToken.intValue;
cell.x = Clazz.doubleToInt (nnn / 100) - 4;
cell.y = Clazz.doubleToInt ((nnn % 100) / 10) - 4;
cell.z = (nnn % 10) - 4;
return this.addTokenToPostfix (1095761925, cell);
}if (!this.isToken (1048586) || !this.getNumericalToken ()) return this.error (3);
cell.x = this.floatValue ();
if (this.tokPeekIs (269484080)) this.tokenNext ();
if (!this.getNumericalToken ()) return this.error (3);
cell.y = this.floatValue ();
if (this.tokPeekIs (269484080)) this.tokenNext ();
if (!this.getNumericalToken () || !this.tokenNextTok (1048590)) return this.error (3);
cell.z = this.floatValue ();
return this.addTokenToPostfix (1095761925, cell);
}, $fz.isPrivate = true, $fz));
$_M(c$, "clauseDefine", 
($fz = function (haveToken, forceString) {
if (!haveToken) {
var token = this.tokenNext ();
if (forceString) token = J.script.T.tokenDefineString;
this.addTokenToPostfixToken (token);
}if (this.tokPeek () == 0) return this.error (4);
if (!this.addSubstituteTokenIf (1048586, J.script.T.tokenExpressionBegin)) return this.addNextToken () && this.checkForItemSelector (true);
while (this.moreTokens () && !this.tokPeekIs (1048590)) {
if (this.tokPeekIs (1048586)) {
if (!this.checkForCoordinate (true)) return false;
} else {
this.addNextToken ();
}}
return this.addSubstituteTokenIf (1048590, J.script.T.tokenExpressionEnd) && this.checkForItemSelector (true);
}, $fz.isPrivate = true, $fz), "~B,~B");
$_M(c$, "generateResidueSpecCode", 
($fz = function (token) {
if (this.residueSpecCodeGenerated) this.addTokenToPostfixToken (J.script.T.tokenAND);
this.addTokenToPostfixToken (token);
this.residueSpecCodeGenerated = true;
return true;
}, $fz.isPrivate = true, $fz), "J.script.T");
$_M(c$, "clauseResidueSpec", 
($fz = function () {
var tok = this.tokPeek ();
this.residueSpecCodeGenerated = false;
var checkResNameSpec = false;
switch (tok) {
case 0:
case 3145732:
case 3145750:
return false;
case 269484066:
case 2:
case 269484210:
case 5:
break;
case 269484209:
case 269484096:
case 1073741824:
checkResNameSpec = true;
break;
default:
if (J.script.T.tokAttr (tok, 269484288)) return false;
var str = "" + this.valuePeek ();
checkResNameSpec = (str.length == 2 || str.length == 3);
if (!checkResNameSpec) return false;
}
var specSeen = false;
if (checkResNameSpec) {
if (!this.clauseResNameSpec ()) return false;
specSeen = true;
tok = this.tokPeek ();
if (J.script.T.tokAttr (tok, 269484288)) {
this.returnToken ();
this.ltokenPostfix.remove (this.ltokenPostfix.size () - 1);
return false;
}}var wasInteger = false;
if (tok == 269484209 || tok == 2 || tok == 5) {
wasInteger = (tok == 2);
if (this.tokPeekIs (269484209)) this.getToken ();
 else if (!this.clauseSequenceSpec ()) return false;
specSeen = true;
tok = this.tokPeek ();
}if (tok == 269484066 || tok == 269484209 || tok == 1073741824 || tok == 1112541205 || tok == 1112541206 || tok == 1112541207 || tok == 1141899280 || tok == 2 && !wasInteger) {
if (!this.clauseChainSpec (tok)) return false;
specSeen = true;
tok = this.tokPeek ();
}if (tok == 1048584) {
if (!this.clauseAtomSpec ()) return false;
specSeen = true;
tok = this.tokPeek ();
}if (tok == 269484210) {
if (!this.clauseAlternateSpec ()) return false;
specSeen = true;
tok = this.tokPeek ();
}if (tok == 269484066 || tok == 269484208) {
if (!this.clauseModelSpec ()) return false;
specSeen = true;
tok = this.tokPeek ();
}if (!specSeen) return this.error (14);
if (!this.residueSpecCodeGenerated) {
this.addTokenToPostfixToken (J.script.T.tokenAll);
}return true;
}, $fz.isPrivate = true, $fz));
$_M(c$, "clauseResNameSpec", 
($fz = function () {
this.getToken ();
switch (this.theToken.tok) {
case 269484209:
return true;
case 269484096:
var strSpec = "";
while (this.getToken () != null && !this.isToken (269484097)) strSpec += this.theValue;

if (!this.isToken (269484097)) return false;
if (strSpec === "") return true;
var pt;
if (strSpec.length > 0 && (pt = strSpec.indexOf ("*")) >= 0 && pt != strSpec.length - 1) return this.error (14);
strSpec = strSpec.toUpperCase ();
return this.generateResidueSpecCode (J.script.T.o (1048612, strSpec));
default:
var res = this.theValue;
if (this.tokPeekIs (269484209)) {
res = this.theValue + "*";
this.getToken ();
}return this.generateResidueSpecCode (J.script.T.o (1073741824, res));
}
}, $fz.isPrivate = true, $fz));
$_M(c$, "clauseSequenceSpec", 
($fz = function () {
var seqToken = this.getSequenceCode (false);
if (seqToken == null) return false;
var tok = this.tokPeek ();
if (tok == 269484192 || tok == 2 && this.intPeek () < 0) {
if (tok == 269484192) {
this.tokenNext ();
} else {
var i = -this.intPeek ();
this.tokenNext ().intValue = i;
this.returnToken ();
}seqToken.tok = 1048615;
this.generateResidueSpecCode (seqToken);
return this.addTokenToPostfixToken (this.getSequenceCode (true));
}return this.generateResidueSpecCode (seqToken);
}, $fz.isPrivate = true, $fz));
$_M(c$, "getSequenceCode", 
($fz = function (isSecond) {
var seqcode = 2147483647;
var seqvalue = 2147483647;
var tokPeek = this.tokPeek ();
if (tokPeek == 5) seqcode = this.tokenNext ().intValue;
 else if (tokPeek == 2) seqvalue = this.tokenNext ().intValue;
 else if (!isSecond) {
return null;
}return J.script.T.tv (1048614, seqvalue, Integer.$valueOf (seqcode));
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "clauseChainSpec", 
($fz = function (tok) {
if (tok == 269484066) {
this.tokenNext ();
tok = this.tokPeek ();
if (this.isSpecTerminator (tok)) return this.generateResidueSpecCode (J.script.T.tv (1048609, 0, "spec_chain"));
}var chain;
switch (tok) {
case 269484209:
return (this.getToken () != null);
case 2:
this.getToken ();
var val = this.theToken.intValue;
if (val < 0 || val > 9) return this.error (8);
chain = String.fromCharCode (48 + val);
break;
default:
var strChain = "" + this.getToken ().value;
if (strChain.length != 1) return this.error (8);
chain = strChain.charAt (0);
if (chain == '?') return true;
break;
}
return this.generateResidueSpecCode (J.script.T.tv (1048609, chain.charCodeAt (0), "spec_chain"));
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "isSpecTerminator", 
($fz = function (tok) {
switch (tok) {
case 0:
case 269484208:
case 269484128:
case 269484112:
case 269484144:
case 269484080:
case 269484210:
case 269484049:
case 1048590:
return true;
}
return false;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "clauseAlternateSpec", 
($fz = function () {
this.tokenNext ();
var tok = this.tokPeek ();
if (this.isSpecTerminator (tok)) return this.generateResidueSpecCode (J.script.T.o (1048607, null));
var alternate = this.getToken ().value;
switch (this.theToken.tok) {
case 269484209:
case 4:
case 2:
case 1073741824:
break;
default:
return this.error (10);
}
return this.generateResidueSpecCode (J.script.T.o (1048607, alternate));
}, $fz.isPrivate = true, $fz));
$_M(c$, "clauseModelSpec", 
($fz = function () {
this.getToken ();
if (this.tokPeekIs (269484209)) {
this.getToken ();
return true;
}switch (this.tokPeek ()) {
case 2:
return this.generateResidueSpecCode (J.script.T.o (1048610, Integer.$valueOf (this.getToken ().intValue)));
case 3:
return this.generateResidueSpecCode (J.script.T.tv (1048610, this.fixModelSpec (this.getToken ()), this.theValue));
case 269484080:
case 1048590:
case 0:
return this.generateResidueSpecCode (J.script.T.o (1048610, Integer.$valueOf (1)));
}
return this.error (10);
}, $fz.isPrivate = true, $fz));
$_M(c$, "fixModelSpec", 
($fz = function (token) {
var ival = token.intValue;
if (ival == 2147483647) {
var f = (this.theValue).floatValue ();
if (f == Clazz.floatToInt (f)) ival = (Clazz.floatToInt (f)) * 1000000;
if (ival < 0) ival = 2147483647;
}return ival;
}, $fz.isPrivate = true, $fz), "J.script.T");
$_M(c$, "clauseAtomSpec", 
($fz = function () {
if (!this.tokenNextTok (1048584)) return this.error (7);
if (this.getToken () == null) return true;
var atomSpec = "";
if (this.isToken (2)) {
atomSpec += "" + this.theToken.intValue;
if (this.getToken () == null) return this.error (7);
}switch (this.theToken.tok) {
case 269484209:
return true;
}
atomSpec += "" + this.theToken.value;
if (this.tokPeekIs (269484209)) {
this.tokenNext ();
atomSpec += "'";
}var atomID = J.viewer.JC.lookupSpecialAtomID (atomSpec.toUpperCase ());
return this.generateResidueSpecCode (J.script.T.tv (1048608, atomID, atomSpec));
}, $fz.isPrivate = true, $fz));
c$.errorString = $_M(c$, "errorString", 
function (iError, value, more, translated) {
var doTranslate = false;
if (!translated && (doTranslate = J.i18n.GT.getDoTranslate ()) == true) J.i18n.GT.setDoTranslate (false);
var msg;
switch (iError) {
default:
msg = "Unknown compiler error message number: " + iError;
break;
case 0:
msg = J.i18n.GT._ ("bad argument count");
break;
case 1:
msg = J.i18n.GT._ ("invalid context for {0}");
break;
case 2:
msg = J.i18n.GT._ ("command expected");
break;
case 3:
msg = J.i18n.GT._ ("{ number number number } expected");
break;
case 4:
msg = J.i18n.GT._ ("unexpected end of script command");
break;
case 5:
msg = J.i18n.GT._ ("end of expression expected");
break;
case 6:
msg = J.i18n.GT._ ("identifier or residue specification expected");
break;
case 7:
msg = J.i18n.GT._ ("invalid atom specification");
break;
case 8:
msg = J.i18n.GT._ ("invalid chain specification");
break;
case 9:
msg = J.i18n.GT._ ("invalid expression token: {0}");
break;
case 10:
msg = J.i18n.GT._ ("invalid model specification");
break;
case 11:
msg = J.i18n.GT._ ("missing END for {0}");
break;
case 12:
msg = J.i18n.GT._ ("number expected");
break;
case 13:
msg = J.i18n.GT._ ("number or variable name expected");
break;
case 14:
msg = J.i18n.GT._ ("residue specification (ALA, AL?, A*) expected");
break;
case 15:
msg = J.i18n.GT._ ("{0} expected");
break;
case 16:
msg = J.i18n.GT._ ("{0} unexpected");
break;
case 17:
msg = J.i18n.GT._ ("unrecognized expression token: {0}");
break;
case 18:
msg = J.i18n.GT._ ("unrecognized {0} parameter");
break;
case 19:
msg = J.i18n.GT._ ("unrecognized token: {0}");
break;
}
if (msg.indexOf ("{0}") < 0) {
if (value != null) msg += ": " + value;
} else {
msg = J.util.TextFormat.simpleReplace (msg, "{0}", value);
if (msg.indexOf ("{1}") >= 0) msg = J.util.TextFormat.simpleReplace (msg, "{1}", more);
 else if (more != null) msg += ": " + more;
}if (!translated) J.i18n.GT.setDoTranslate (doTranslate);
return msg;
}, "~N,~S,~S,~B");
$_M(c$, "commandExpected", 
function () {
this.ichToken = this.ichCurrentCommand;
return this.error (2);
});
$_M(c$, "error", 
function (error) {
return this.errorIntStr2 (error, null, null);
}, "~N");
$_M(c$, "errorStr", 
function (error, value) {
return this.errorIntStr2 (error, value, null);
}, "~N,~S");
$_M(c$, "errorIntStr2", 
function (iError, value, more) {
var strError = J.script.ScriptCompilationTokenParser.errorString (iError, value, more, true);
var strUntranslated = (J.i18n.GT.getDoTranslate () ? J.script.ScriptCompilationTokenParser.errorString (iError, value, more, false) : null);
return this.errorStr2 (strError, strUntranslated);
}, "~N,~S,~S");
$_M(c$, "isError", 
($fz = function () {
return this.errorMessage != null;
}, $fz.isPrivate = true, $fz));
$_M(c$, "errorStr2", 
function (errorMessage, strUntranslated) {
this.errorMessage = errorMessage;
this.errorMessageUntranslated = strUntranslated;
return false;
}, "~S,~S");
Clazz.defineStatics (c$,
"ERROR_badArgumentCount", 0,
"ERROR_badContext", 1,
"ERROR_commandExpected", 2,
"ERROR_endOfCommandUnexpected", 4,
"ERROR_invalidExpressionToken", 9,
"ERROR_missingEnd", 11,
"ERROR_tokenExpected", 15,
"ERROR_tokenUnexpected", 16,
"ERROR_unrecognizedParameter", 18,
"ERROR_unrecognizedToken", 19,
"ERROR_coordinateExpected", 3,
"ERROR_endOfExpressionExpected", 5,
"ERROR_identifierOrResidueSpecificationExpected", 6,
"ERROR_invalidAtomSpecification", 7,
"ERROR_invalidChainSpecification", 8,
"ERROR_invalidModelSpecification", 10,
"ERROR_numberExpected", 12,
"ERROR_numberOrVariableNameExpected", 13,
"ERROR_residueSpecificationExpected", 14,
"ERROR_unrecognizedExpressionToken", 17);
});
// 
//// J\script\ScriptFlowContext.js 
// 
Clazz.declarePackage ("J.script");
Clazz.load (null, "J.script.ScriptFlowContext", ["J.script.ScriptCompiler"], function () {
c$ = Clazz.decorateAsClass (function () {
this.compiler = null;
this.token = null;
this.pt0 = 0;
this.ptDefault = 0;
this.$function = null;
this.$var = null;
this.parent = null;
this.lineStart = 0;
this.commandStart = 0;
this.ptLine = 0;
this.ptCommand = 0;
this.forceEndIf = true;
this.ident = null;
Clazz.instantialize (this, arguments);
}, J.script, "ScriptFlowContext");
Clazz.makeConstructor (c$, 
function (compiler, token, pt0, parent) {
this.compiler = compiler;
this.token = token;
this.ident = token.value;
this.pt0 = pt0;
this.parent = parent;
this.lineStart = this.ptLine = this.compiler.lineCurrent;
this.commandStart = this.ptCommand = this.compiler.iCommand;
}, "J.script.ScriptCompiler,J.script.ContextToken,~N,J.script.ScriptFlowContext");
$_M(c$, "getBreakableContext", 
function (nLevelsUp) {
var f = this;
while (f != null && (!J.script.ScriptCompiler.isBreakableContext (f.token.tok) || nLevelsUp-- > 0)) f = f.getParent ();

return f;
}, "~N");
$_M(c$, "checkForceEndIf", 
function () {
var test = this.forceEndIf && this.ptCommand < this.compiler.iCommand && this.ptLine == this.compiler.lineCurrent;
if (test) this.forceEndIf = false;
return test;
});
$_M(c$, "setPt0", 
function (pt0, isDefault) {
this.pt0 = pt0;
if (isDefault) this.ptDefault = pt0;
this.setLine ();
return pt0;
}, "~N,~B");
$_M(c$, "setLine", 
function () {
this.ptLine = this.compiler.lineCurrent;
this.ptCommand = this.compiler.iCommand + 1;
});
Clazz.overrideMethod (c$, "toString", 
function () {
return "ident " + this.ident + " line " + this.lineStart + " command " + this.commandStart;
});
$_M(c$, "getParent", 
function () {
return this.parent;
});
$_M(c$, "path", 
function () {
var s = "";
var f = this;
while (f != null) {
s = f.ident + "-" + s;
f = f.parent;
}
return "[" + s + "]";
});
$_M(c$, "setFunction", 
function ($function) {
this.$function = $function;
}, "J.script.ScriptFunction");
});
// 
//// J\script\ScriptFunction.js 
// 
Clazz.declarePackage ("J.script");
Clazz.load (["J.api.JmolScriptFunction", "java.util.Hashtable", "J.util.JmolList"], "J.script.ScriptFunction", ["J.script.SV", "$.T", "J.util.ArrayUtil", "$.SB"], function () {
c$ = Clazz.decorateAsClass (function () {
this.pt0 = 0;
this.chpt0 = 0;
this.cmdpt0 = -1;
this.typeName = null;
this.name = null;
this.nParameters = 0;
this.names = null;
this.tok = 0;
this.variables = null;
this.returnValue = null;
this.aatoken = null;
this.lineIndices = null;
this.lineNumbers = null;
this.script = null;
Clazz.instantialize (this, arguments);
}, J.script, "ScriptFunction", null, J.api.JmolScriptFunction);
Clazz.prepareFields (c$, function () {
this.names =  new J.util.JmolList ();
this.variables =  new java.util.Hashtable ();
});
$_M(c$, "isVariable", 
function (ident) {
return this.variables.containsKey (ident);
}, "~S");
Clazz.makeConstructor (c$, 
function () {
});
Clazz.makeConstructor (c$, 
function (name, tok) {
this.set (name, tok);
this.typeName = J.script.T.nameOf (tok);
}, "~S,~N");
$_M(c$, "set", 
function (name, tok) {
this.name = name;
this.tok = tok;
}, "~S,~N");
$_M(c$, "setVariables", 
function (contextVariables, params) {
var nParams = (params == null ? 0 : params.size ());
for (var i = this.names.size (); --i >= 0; ) {
var name = this.names.get (i).toLowerCase ();
var $var = (i < this.nParameters && i < nParams ? params.get (i) : null);
if ($var != null && $var.tok != 7) $var = J.script.SV.newScriptVariableToken ($var);
contextVariables.put (name, ($var == null ? J.script.SV.newVariable (4, "").setName (name) : $var));
}
contextVariables.put ("_retval", J.script.SV.newScriptVariableInt (this.tok == 364558 ? 2147483647 : 0));
}, "java.util.Map,J.util.JmolList");
$_M(c$, "unsetVariables", 
function (contextVariables, params) {
var nParams = (params == null ? 0 : params.size ());
var nNames = this.names.size ();
if (nParams == 0 || nNames == 0) return;
for (var i = 0; i < nNames && i < nParams; i++) {
var global = params.get (i);
if (global.tok != 7) continue;
var local = contextVariables.get (this.names.get (i).toLowerCase ());
if (local.tok != 7) continue;
global.value = local.value;
}
}, "java.util.Map,J.util.JmolList");
$_M(c$, "addVariable", 
function (name, isParameter) {
this.variables.put (name, name);
this.names.addLast (name);
if (isParameter) this.nParameters++;
}, "~S,~B");
c$.setFunction = $_M(c$, "setFunction", 
function ($function, script, ichCurrentCommand, pt, lineNumbers, lineIndices, lltoken) {
var cmdpt0 = $function.cmdpt0;
var chpt0 = $function.chpt0;
var nCommands = pt - cmdpt0;
$function.setScript (script.substring (chpt0, ichCurrentCommand));
var aatoken = $function.aatoken =  new Array (nCommands);
$function.lineIndices = J.util.ArrayUtil.newInt2 (nCommands);
$function.lineNumbers =  Clazz.newShortArray (nCommands, 0);
var line0 = (lineNumbers[cmdpt0] - 1);
for (var i = 0; i < nCommands; i++) {
$function.lineNumbers[i] = (lineNumbers[cmdpt0 + i] - line0);
$function.lineIndices[i] = [lineIndices[cmdpt0 + i][0] - chpt0, lineIndices[cmdpt0 + i][1] - chpt0];
aatoken[i] = lltoken.get (cmdpt0 + i);
if (aatoken[i].length > 0) {
var tokenCommand = aatoken[i][0];
if (J.script.T.tokAttr (tokenCommand.tok, 102400)) tokenCommand.intValue -= (tokenCommand.intValue < 0 ? -cmdpt0 : cmdpt0);
}}
for (var i = pt; --i >= cmdpt0; ) {
lltoken.remove (i);
lineIndices[i][0] = lineIndices[i][1] = 0;
}
}, "J.script.ScriptFunction,~S,~N,~N,~A,~A,J.util.JmolList");
$_M(c$, "setScript", 
($fz = function (s) {
this.script = s;
if (this.script != null && this.script !== "" && !this.script.endsWith ("\n")) this.script += "\n";
}, $fz.isPrivate = true, $fz), "~S");
Clazz.overrideMethod (c$, "toString", 
function () {
var s =  new J.util.SB ().append ("/*\n * ").append (this.name).append ("\n */\n").append (this.getSignature ()).append ("{\n");
if (this.script != null) s.append (this.script);
s.append ("}\n");
return s.toString ();
});
Clazz.overrideMethod (c$, "getSignature", 
function () {
var s =  new J.util.SB ().append (this.typeName).append (" ").append (this.name).append (" (");
for (var i = 0; i < this.nParameters; i++) {
if (i > 0) s.append (", ");
s.append (this.names.get (i));
}
s.append (")");
return s.toString ();
});
Clazz.overrideMethod (c$, "geTokens", 
function () {
return this.aatoken;
});
Clazz.overrideMethod (c$, "getName", 
function () {
return this.name;
});
Clazz.overrideMethod (c$, "getTok", 
function () {
return this.tok;
});
});
// 
//// J\api\JmolScriptFunction.js 
// 
Clazz.declarePackage ("J.api");
Clazz.declareInterface (J.api, "JmolScriptFunction");
// 
//// J\script\ScriptInterruption.js 
// 
Clazz.declarePackage ("J.script");
Clazz.load (["J.script.ScriptException"], "J.script.ScriptInterruption", null, function () {
c$ = Clazz.decorateAsClass (function () {
this.willResume = false;
Clazz.instantialize (this, arguments);
}, J.script, "ScriptInterruption", J.script.ScriptException);
Clazz.makeConstructor (c$, 
function (eval, why, millis) {
Clazz.superConstructor (this, J.script.ScriptInterruption, [eval, why, "!", eval.viewer.autoExit]);
this.willResume = (millis != 2147483647);
if (why.equals ("delay")) eval.viewer.delayScript (eval, millis);
}, "J.script.ScriptEvaluator,~S,~N");
});
// 
//// J\script\ScriptMathProcessor.js 
// 
Clazz.declarePackage ("J.script");
Clazz.load (null, "J.script.ScriptMathProcessor", ["java.lang.Float", "java.util.Arrays", "$.Date", "$.Hashtable", "java.util.regex.Pattern", "J.atomdata.RadiusData", "J.constant.EnumVdw", "J.modelset.Bond", "$.MeasurementData", "J.script.SV", "$.ScriptEvaluator", "$.T", "J.util.ArrayUtil", "$.AxisAngle4f", "$.BS", "$.BSUtil", "$.ColorEncoder", "$.ColorUtil", "$.Escape", "$.JmolList", "$.JmolMolecule", "$.Logger", "$.Matrix3f", "$.Matrix4f", "$.Measure", "$.P3", "$.P4", "$.Parser", "$.Point3fi", "$.Quaternion", "$.SB", "$.TextFormat", "$.V3"], function () {
c$ = Clazz.decorateAsClass (function () {
this.isSyntaxCheck = false;
this.wasSyntaxCheck = false;
this.logMessages = false;
this.eval = null;
this.viewer = null;
this.oStack = null;
this.xStack = null;
this.ifStack = null;
this.ifPt = -1;
this.oPt = -1;
this.xPt = -1;
this.parenCount = 0;
this.squareCount = 0;
this.braceCount = 0;
this.wasX = false;
this.incrementX = 0;
this.isArrayItem = false;
this.asVector = false;
this.asBitSet = false;
this.ptid = 0;
this.ptx = 2147483647;
this.skipping = false;
this.haveSpaceBeforeSquare = false;
this.equalCount = 0;
Clazz.instantialize (this, arguments);
}, J.script, "ScriptMathProcessor");
Clazz.prepareFields (c$, function () {
this.oStack =  new Array (8);
this.xStack =  new Array (8);
this.ifStack =  Clazz.newCharArray (8, '\0');
});
Clazz.makeConstructor (c$, 
function (eval, isArrayItem, asVector, asBitSet) {
this.eval = eval;
this.viewer = eval.viewer;
this.logMessages = eval.logMessages;
this.isSyntaxCheck = this.wasSyntaxCheck = eval.chk;
this.isArrayItem = isArrayItem;
this.asVector = asVector || isArrayItem;
this.asBitSet = asBitSet;
this.wasX = isArrayItem;
if (this.logMessages) J.util.Logger.info ("initialize RPN");
}, "J.script.ScriptEvaluator,~B,~B,~B");
$_M(c$, "getResult", 
function (allowUnderflow) {
var isOK = true;
while (isOK && this.oPt >= 0) isOK = this.operate ();

if (isOK) {
if (this.asVector) {
var result =  new J.util.JmolList ();
for (var i = 0; i <= this.xPt; i++) result.addLast (J.script.SV.selectItemVar (this.xStack[i]));

return J.script.SV.newVariable (135198, result);
}if (this.xPt == 0) {
var x = this.xStack[0];
if (x.tok == 10 || x.tok == 7 || x.tok == 4 || x.tok == 11 || x.tok == 12) x = J.script.SV.selectItemVar (x);
if (this.asBitSet && x.tok == 7) x = J.script.SV.newVariable (10, J.script.SV.unEscapeBitSetArray (x.value, false));
return x;
}}if (!allowUnderflow && (this.xPt >= 0 || this.oPt >= 0)) {
this.eval.error (22);
}return null;
}, "~B");
$_M(c$, "putX", 
($fz = function (x) {
if (this.skipping) return;
if (++this.xPt == this.xStack.length) this.xStack = J.util.ArrayUtil.doubleLength (this.xStack);
if (this.logMessages) {
J.util.Logger.info ("\nputX: " + x);
}this.xStack[this.xPt] = x;
this.ptx = ++this.ptid;
}, $fz.isPrivate = true, $fz), "J.script.SV");
$_M(c$, "putOp", 
($fz = function (op) {
if (++this.oPt >= this.oStack.length) this.oStack = J.util.ArrayUtil.doubleLength (this.oStack);
this.oStack[this.oPt] = op;
this.ptid++;
}, $fz.isPrivate = true, $fz), "J.script.T");
$_M(c$, "putIf", 
($fz = function (c) {
if (++this.ifPt >= this.ifStack.length) this.ifStack = J.util.ArrayUtil.doubleLength (this.ifStack);
this.ifStack[this.ifPt] = c;
}, $fz.isPrivate = true, $fz), "~S");
$_M(c$, "addXVar", 
function (x) {
this.putX (x);
return this.wasX = true;
}, "J.script.SV");
$_M(c$, "addXObj", 
function (x) {
var v = J.script.SV.getVariable (x);
if (v == null) return false;
this.putX (v);
return this.wasX = true;
}, "~O");
$_M(c$, "addXStr", 
function (x) {
this.putX (J.script.SV.newVariable (4, x));
return this.wasX = true;
}, "~S");
$_M(c$, "addXBool", 
($fz = function (x) {
this.putX (J.script.SV.getBoolean (x));
return this.wasX = true;
}, $fz.isPrivate = true, $fz), "~B");
$_M(c$, "addXInt", 
($fz = function (x) {
this.putX (J.script.SV.newScriptVariableInt (x));
return this.wasX = true;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "addXList", 
($fz = function (x) {
this.putX (J.script.SV.getVariableList (x));
return this.wasX = true;
}, $fz.isPrivate = true, $fz), "J.util.JmolList");
$_M(c$, "addXMap", 
($fz = function (x) {
this.putX (J.script.SV.getVariableMap (x));
return this.wasX = true;
}, $fz.isPrivate = true, $fz), "java.util.Map");
$_M(c$, "addXM3", 
($fz = function (x) {
this.putX (J.script.SV.newVariable (11, x));
return this.wasX = true;
}, $fz.isPrivate = true, $fz), "J.util.Matrix3f");
$_M(c$, "addXM4", 
($fz = function (x) {
this.putX (J.script.SV.newVariable (12, x));
return this.wasX = true;
}, $fz.isPrivate = true, $fz), "J.util.Matrix4f");
$_M(c$, "addXFloat", 
($fz = function (x) {
if (Float.isNaN (x)) return this.addXStr ("NaN");
this.putX (J.script.SV.newVariable (3, Float.$valueOf (x)));
return this.wasX = true;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "addXBs", 
function (bs) {
this.putX (J.script.SV.newVariable (10, bs));
return this.wasX = true;
}, "J.util.BS");
$_M(c$, "addXPt", 
function (pt) {
this.putX (J.script.SV.newVariable (8, pt));
return this.wasX = true;
}, "J.util.P3");
$_M(c$, "addXPt4", 
function (pt) {
this.putX (J.script.SV.newVariable (9, pt));
return this.wasX = true;
}, "J.util.P4");
$_M(c$, "addXNum", 
function (x) {
if (this.wasX) switch (x.tok) {
case 2:
if (x.intValue < 0) {
this.addOp (J.script.T.tokenMinus);
x = J.script.SV.newScriptVariableInt (-x.intValue);
}break;
case 3:
var f = (x.value).floatValue ();
if (f < 0 || f == 0 && 1 / f == -Infinity) {
this.addOp (J.script.T.tokenMinus);
x = J.script.SV.newVariable (3, Float.$valueOf (-f));
}break;
}
this.putX (x);
return this.wasX = true;
}, "J.script.SV");
$_M(c$, "addXAV", 
function (x) {
this.putX (J.script.SV.getVariableAV (x));
return this.wasX = true;
}, "~A");
$_M(c$, "addXAD", 
function (x) {
this.putX (J.script.SV.getVariableAD (x));
return this.wasX = true;
}, "~A");
$_M(c$, "addXAS", 
function (x) {
this.putX (J.script.SV.getVariableAS (x));
return this.wasX = true;
}, "~A");
$_M(c$, "addXAI", 
function (x) {
this.putX (J.script.SV.getVariableAI (x));
return this.wasX = true;
}, "~A");
$_M(c$, "addXAII", 
function (x) {
this.putX (J.script.SV.getVariableAII (x));
return this.wasX = true;
}, "~A");
$_M(c$, "addXAF", 
function (x) {
this.putX (J.script.SV.getVariableAF (x));
return this.wasX = true;
}, "~A");
$_M(c$, "addXAFF", 
function (x) {
this.putX (J.script.SV.getVariableAFF (x));
return this.wasX = true;
}, "~A");
c$.isOpFunc = $_M(c$, "isOpFunc", 
($fz = function (op) {
return (J.script.T.tokAttr (op.tok, 135266304) && op !== J.script.T.tokenArraySquare || op.tok == 269484241 && J.script.T.tokAttr (op.intValue, 135266304));
}, $fz.isPrivate = true, $fz), "J.script.T");
$_M(c$, "addOp", 
function (op) {
return this.addOpAllowMath (op, true);
}, "J.script.T");
$_M(c$, "addOpAllowMath", 
function (op, allowMathFunc) {
if (this.logMessages) {
J.util.Logger.info ("addOp entry\naddOp: " + op);
}var tok0 = (this.oPt >= 0 ? this.oStack[this.oPt].tok : 0);
this.skipping = (this.ifPt >= 0 && (this.ifStack[this.ifPt] == 'F' || this.ifStack[this.ifPt] == 'X'));
if (this.skipping) {
switch (op.tok) {
case 269484048:
this.putOp (op);
return true;
case 269484066:
if (tok0 != 269484066 || this.ifStack[this.ifPt] == 'X') return true;
this.ifStack[this.ifPt] = 'T';
this.wasX = false;
this.skipping = false;
return true;
case 269484049:
if (tok0 == 269484048) {
this.oPt--;
return true;
}if (tok0 != 269484066) {
this.putOp (op);
return true;
}this.wasX = true;
this.ifPt--;
this.oPt -= 2;
this.skipping = false;
return true;
default:
return true;
}
}var newOp = null;
var tok;
var isLeftOp = false;
var isDotSelector = (op.tok == 269484241);
if (isDotSelector && !this.wasX) return false;
var isMathFunc = (allowMathFunc && J.script.ScriptMathProcessor.isOpFunc (op));
if (this.oPt >= 1 && op.tok != 269484048 && tok0 == 135266319) tok0 = this.oStack[--this.oPt].tok;
var isArgument = (this.oPt >= 1 && tok0 == 269484048);
switch (op.tok) {
case 1073742195:
this.haveSpaceBeforeSquare = true;
return true;
case 269484080:
if (!this.wasX) return false;
break;
case 32:
case 64:
case 96:
case 128:
case 160:
case 192:
case 480:
tok = (this.oPt < 0 ? 0 : tok0);
if (!this.wasX || !(tok == 269484241 || tok == 1678770178 || tok == 1141899265)) return false;
this.oStack[this.oPt].intValue |= op.tok;
return true;
case 269484096:
isLeftOp = true;
if (!this.wasX || this.haveSpaceBeforeSquare) {
this.squareCount++;
op = newOp = J.script.T.tokenArraySquare;
this.haveSpaceBeforeSquare = false;
}break;
case 269484097:
break;
case 269484225:
case 269484226:
this.incrementX = (op.tok == 269484226 ? 1 : -1);
if (this.ptid == this.ptx) {
if (this.isSyntaxCheck) return true;
var x = this.xStack[this.xPt];
this.xStack[this.xPt] = J.script.SV.newVariable (4, "").setv (x, false);
return x.increment (this.incrementX);
}break;
case 269484192:
if (this.wasX) break;
this.addXInt (0);
op = J.script.SV.newVariable (269484224, "-");
break;
case 269484049:
if (!this.wasX && this.oPt >= 1 && tok0 == 269484048 && !J.script.ScriptMathProcessor.isOpFunc (this.oStack[this.oPt - 1])) return false;
break;
case 269484144:
case 269484048:
isLeftOp = true;
default:
if (isMathFunc) {
if (!isDotSelector && this.wasX && !isArgument) return false;
newOp = op;
isLeftOp = true;
break;
}if (this.wasX == isLeftOp && tok0 != 269484241) return false;
break;
}
while (this.oPt >= 0 && tok0 != 269484066 && (!isLeftOp || tok0 == 269484241 && (op.tok == 269484241 || op.tok == 269484096)) && J.script.T.getPrecedence (tok0) >= J.script.T.getPrecedence (op.tok)) {
if (this.logMessages) {
J.util.Logger.info ("\noperating, oPt=" + this.oPt + " isLeftOp=" + isLeftOp + " oStack[oPt]=" + J.script.T.nameOf (tok0) + "        prec=" + J.script.T.getPrecedence (tok0) + " pending op=\"" + J.script.T.nameOf (op.tok) + "\" prec=" + J.script.T.getPrecedence (op.tok));
this.dumpStacks ("operating");
}if (op.tok == 269484049 && tok0 == 269484048) {
if (this.xPt >= 0) this.xStack[this.xPt] = J.script.SV.selectItemVar (this.xStack[this.xPt]);
break;
}if (op.tok == 269484097 && tok0 == 135266306) {
break;
}if (op.tok == 269484097 && tok0 == 269484096) {
if (this.isArrayItem && this.squareCount == 1 && this.equalCount == 0) {
this.addXVar (J.script.SV.newScriptVariableToken (J.script.T.tokenArraySelector));
break;
}if (!this.doBitsetSelect ()) return false;
break;
}if (!this.operate ()) return false;
tok0 = (this.oPt >= 0 ? this.oStack[this.oPt].tok : 0);
}
if (newOp != null) this.addXVar (J.script.SV.newVariable (269484436, newOp));
switch (op.tok) {
case 269484048:
this.parenCount++;
this.wasX = false;
break;
case 806354977:
var isFirst = this.getX ().asBoolean ();
if (tok0 == 269484066) this.ifPt--;
 else this.putOp (J.script.T.tokenColon);
this.putIf (isFirst ? 'T' : 'F');
this.skipping = !isFirst;
this.wasX = false;
return true;
case 269484066:
if (tok0 != 269484066) return false;
if (this.ifPt < 0) return false;
this.ifStack[this.ifPt] = 'X';
this.wasX = false;
this.skipping = true;
return true;
case 269484049:
this.wasX = true;
if (this.parenCount-- <= 0) return false;
if (tok0 == 269484066) {
this.ifPt--;
this.oPt--;
}this.oPt--;
if (this.oPt < 0) return true;
if (J.script.ScriptMathProcessor.isOpFunc (this.oStack[this.oPt]) && !this.evaluateFunction (0)) return false;
this.skipping = (this.ifPt >= 0 && this.ifStack[this.ifPt] == 'X');
return true;
case 269484080:
this.wasX = false;
return true;
case 269484096:
this.squareCount++;
this.wasX = false;
break;
case 269484097:
this.wasX = true;
if (this.squareCount-- <= 0 || this.oPt < 0) return false;
if (this.oStack[this.oPt].tok == 135266306) return this.evaluateFunction (269484096);
this.oPt--;
return true;
case 269484241:
this.wasX = (!allowMathFunc || !J.script.T.tokAttr (op.intValue, 135266304));
break;
case 1048586:
this.braceCount++;
this.wasX = false;
break;
case 1048590:
if (this.braceCount-- <= 0) return false;
this.wasX = false;
break;
case 269484128:
case 269484112:
if (!this.wasSyntaxCheck && this.xPt < 0) return false;
if (!this.wasSyntaxCheck && this.xStack[this.xPt].tok != 10 && this.xStack[this.xPt].tok != 7) {
var tf = this.getX ().asBoolean ();
this.addXVar (J.script.SV.getBoolean (tf));
if (tf == (op.tok == 269484112)) {
this.isSyntaxCheck = true;
op = (op.tok == 269484112 ? J.script.T.tokenOrTRUE : J.script.T.tokenAndFALSE);
}}this.wasX = false;
break;
case 269484436:
if (this.squareCount == 0) this.equalCount++;
this.wasX = false;
break;
default:
this.wasX = false;
}
this.putOp (op);
if (op.tok == 269484241 && (op.intValue & -481) == 135368713 && op.intValue != 135368713) {
return this.evaluateFunction (0);
}return true;
}, "J.script.T,~B");
$_M(c$, "doBitsetSelect", 
($fz = function () {
if (this.xPt < 0 || this.xPt == 0 && !this.isArrayItem) {
return false;
}var var1 = this.xStack[this.xPt--];
var $var = this.xStack[this.xPt];
if ($var.tok == 7 && var1.tok == 4 && $var.intValue != 2147483647) {
$var = J.script.SV.selectItemVar2 ($var, -2147483648);
}if ($var.tok == 6) {
var v = $var.mapValue (J.script.SV.sValue (var1));
this.xStack[this.xPt] = (v == null ? J.script.SV.newVariable (4, "") : v);
return true;
}var i = var1.asInt ();
switch ($var.tok) {
default:
$var = J.script.SV.newVariable (4, J.script.SV.sValue ($var));
case 10:
case 7:
case 4:
case 11:
case 12:
this.xStack[this.xPt] = J.script.SV.selectItemVar2 ($var, i);
break;
}
return true;
}, $fz.isPrivate = true, $fz));
$_M(c$, "dumpStacks", 
function (message) {
J.util.Logger.info ("\n\n------------------\nRPN stacks: " + message + "\n");
for (var i = 0; i <= this.xPt; i++) J.util.Logger.info ("x[" + i + "]: " + this.xStack[i]);

J.util.Logger.info ("\n");
for (var i = 0; i <= this.oPt; i++) J.util.Logger.info ("o[" + i + "]: " + this.oStack[i] + " prec=" + J.script.T.getPrecedence (this.oStack[i].tok));

J.util.Logger.info (" ifStack = " + ( String.instantialize (this.ifStack)).substring (0, this.ifPt + 1));
}, "~S");
$_M(c$, "getX", 
($fz = function () {
if (this.xPt < 0) this.eval.error (13);
var v = J.script.SV.selectItemVar (this.xStack[this.xPt]);
this.xStack[this.xPt--] = null;
return v;
}, $fz.isPrivate = true, $fz));
$_M(c$, "evaluateFunction", 
($fz = function (tok) {
var op = this.oStack[this.oPt--];
if (tok == 0) tok = (op.tok == 269484241 ? op.intValue & -481 : op.tok);
var nParamMax = J.script.T.getMaxMathParams (tok);
var nParam = 0;
var pt = this.xPt;
while (pt >= 0 && this.xStack[pt--].value !== op) nParam++;

if (nParamMax > 0 && nParam > nParamMax) return false;
var args =  new Array (nParam);
for (var i = nParam; --i >= 0; ) args[i] = this.getX ();

this.xPt--;
if (this.isSyntaxCheck) return (op.tok == 269484241 ? true : this.addXBool (true));
switch (tok) {
case 135266826:
case 135266819:
case 135266821:
case 135266318:
case 135266820:
case 135266822:
return this.evaluateMath (args, tok);
case 1276118017:
case 1276117504:
case 1276117507:
case 1276117509:
return this.evaluateList (op.intValue, args);
case 135266306:
case 269484096:
return this.evaluateArray (args, tok == 269484096);
case 135266307:
case 135270417:
return this.evaluateQuaternion (args, tok);
case 1276118529:
return this.evaluateBin (args);
case 1276117512:
case 1276117513:
return this.evaluateRowCol (args, tok);
case 1766856708:
return this.evaluateColor (args);
case 135270405:
return this.evaluateCompare (args);
case 135266310:
return this.evaluateConnected (args);
case 135267329:
return this.evaluateCross (args);
case 135270407:
return this.evaluateData (args);
case 135266305:
case 1276118018:
case 1276117505:
case 1746538509:
if ((tok == 1276118018 || tok == 1276117505) && op.tok == 269484241) return this.evaluateDot (args, tok);
return this.evaluateMeasure (args, op.tok);
case 1229984263:
case 135271426:
return this.evaluateLoad (args, tok);
case 1276118532:
return this.evaluateFind (args);
case 135368713:
return this.evaluateUserFunction (op.value, args, op.intValue, op.tok == 269484241);
case 1288701960:
case 1826248715:
return this.evaluateLabel (op.intValue, args);
case 135270410:
return this.evaluateGetProperty (args);
case 137363468:
return this.evaluateHelix (args);
case 135267841:
case 135266319:
case 135267842:
return this.evaluatePlane (args, tok);
case 135287308:
case 135271429:
return this.evaluateScript (args, tok);
case 1276117506:
case 1276117508:
case 1276117510:
return this.evaluateString (op.intValue, args);
case 135266320:
return this.evaluatePoint (args);
case 135304707:
return this.evaluatePrompt (args);
case 135267332:
return this.evaluateRandom (args);
case 1276118019:
return this.evaluateReplace (args);
case 135267335:
case 135267336:
case 1238369286:
return this.evaluateSubstructure (args, tok);
case 135270422:
return this.evaluateCache (args);
case 1276117010:
case 1276117011:
return this.evaluateSort (args, tok);
case 1297090050:
return this.evaluateSymop (args, op.tok == 269484241);
case 135266324:
return this.evaluateWithin (args);
case 135402505:
return this.evaluateContact (args);
case 135270421:
return this.evaluateWrite (args);
}
return false;
}, $fz.isPrivate = true, $fz), "~N");
$_M(c$, "evaluateCache", 
($fz = function (args) {
if (args.length > 0) return false;
return this.addXMap (this.viewer.cacheList ());
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluateCompare", 
($fz = function (args) {
if (args.length < 2 || args.length > 5) return false;
var stddev;
var sOpt = J.script.SV.sValue (args[args.length - 1]);
var isStdDev = sOpt.equalsIgnoreCase ("stddev");
var isIsomer = sOpt.equalsIgnoreCase ("ISOMER");
var isSmiles = (!isIsomer && args.length > (isStdDev ? 3 : 2));
var bs1 = (args[0].tok == 10 ? args[0].value : null);
var bs2 = (args[1].tok == 10 ? args[1].value : null);
var smiles1 = (bs1 == null ? J.script.SV.sValue (args[0]) : "");
var smiles2 = (bs2 == null ? J.script.SV.sValue (args[1]) : "");
var m =  new J.util.Matrix4f ();
stddev = NaN;
var ptsA;
var ptsB;
if (isSmiles) {
if (bs1 == null || bs2 == null) return false;
}if (isIsomer) {
if (args.length != 3) return false;
if (bs1 == null && bs2 == null) return this.addXStr (this.viewer.getSmilesMatcher ().getRelationship (smiles1, smiles2).toUpperCase ());
var mf1 = (bs1 == null ? this.viewer.getSmilesMatcher ().getMolecularFormula (smiles1, false) : J.util.JmolMolecule.getMolecularFormula (this.viewer.getModelSet ().atoms, bs1, false));
var mf2 = (bs2 == null ? this.viewer.getSmilesMatcher ().getMolecularFormula (smiles2, false) : J.util.JmolMolecule.getMolecularFormula (this.viewer.getModelSet ().atoms, bs2, false));
if (!mf1.equals (mf2)) return this.addXStr ("NONE");
if (bs1 != null) smiles1 = this.eval.getSmilesMatches ("", null, bs1, null, false, true);
var check;
if (bs2 == null) {
check = (this.viewer.getSmilesMatcher ().areEqual (smiles2, smiles1) > 0);
} else {
check = ((this.eval.getSmilesMatches (smiles1, null, bs2, null, false, true)).nextSetBit (0) >= 0);
}if (!check) {
var s = smiles1 + smiles2;
if (s.indexOf ("/") >= 0 || s.indexOf ("\\") >= 0 || s.indexOf ("@") >= 0) {
if (smiles1.indexOf ("@") >= 0 && (bs2 != null || smiles2.indexOf ("@") >= 0)) {
smiles1 = this.viewer.getSmilesMatcher ().reverseChirality (smiles1);
if (bs2 == null) {
check = (this.viewer.getSmilesMatcher ().areEqual (smiles1, smiles2) > 0);
} else {
check = ((this.eval.getSmilesMatches (smiles1, null, bs2, null, false, true)).nextSetBit (0) >= 0);
}if (check) return this.addXStr ("ENANTIOMERS");
}if (bs2 == null) {
check = (this.viewer.getSmilesMatcher ().areEqual ("/nostereo/" + smiles2, smiles1) > 0);
} else {
var ret = this.eval.getSmilesMatches ("/nostereo/" + smiles1, null, bs2, null, false, true);
check = ((ret).nextSetBit (0) >= 0);
}if (check) return this.addXStr ("DIASTERIOMERS");
}return this.addXStr ("CONSTITUTIONAL ISOMERS");
}if (bs1 == null || bs2 == null) return this.addXStr ("IDENTICAL");
stddev = this.eval.getSmilesCorrelation (bs1, bs2, smiles1, null, null, null, null, false, false);
return this.addXStr (stddev < 0.2 ? "IDENTICAL" : "IDENTICAL or CONFORMATIONAL ISOMERS (RMSD=" + stddev + ")");
} else if (isSmiles) {
ptsA =  new J.util.JmolList ();
ptsB =  new J.util.JmolList ();
sOpt = J.script.SV.sValue (args[2]);
var isMap = sOpt.equalsIgnoreCase ("MAP");
isSmiles = (sOpt.equalsIgnoreCase ("SMILES"));
var isSearch = (isMap || sOpt.equalsIgnoreCase ("SMARTS"));
if (isSmiles || isSearch) sOpt = (args.length > 3 ? J.script.SV.sValue (args[3]) : null);
if (sOpt == null) return false;
stddev = this.eval.getSmilesCorrelation (bs1, bs2, sOpt, ptsA, ptsB, m, null, !isSmiles, isMap);
if (isMap) {
var nAtoms = ptsA.size ();
if (nAtoms == 0) return this.addXStr ("");
var nMatch = Clazz.doubleToInt (ptsB.size () / nAtoms);
var ret =  new J.util.JmolList ();
for (var i = 0, pt = 0; i < nMatch; i++) {
var a = J.util.ArrayUtil.newInt2 (nAtoms);
ret.addLast (a);
for (var j = 0; j < nAtoms; j++, pt++) a[j] = [(ptsA.get (j)).index, (ptsB.get (pt)).index];

}
return this.addXList (ret);
}} else {
ptsA = this.eval.getPointVector (args[0], 0);
ptsB = this.eval.getPointVector (args[1], 0);
if (ptsA != null && ptsB != null) stddev = J.util.Measure.getTransformMatrix4 (ptsA, ptsB, m, null);
}return (isStdDev || Float.isNaN (stddev) ? this.addXFloat (stddev) : this.addXM4 (m));
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluateSort", 
($fz = function (args, tok) {
if (args.length > 1) return false;
if (tok == 1276117010) {
var n = (args.length == 0 ? 0 : args[0].asInt ());
return this.addXVar (this.getX ().sortOrReverse (n));
}var x = this.getX ();
var match = (args.length == 0 ? null : args[0]);
if (x.tok == 4) {
var n = 0;
var s = J.script.SV.sValue (x);
if (match == null) return this.addXInt (0);
var m = J.script.SV.sValue (match);
for (var i = 0; i < s.length; i++) {
var pt = s.indexOf (m, i);
if (pt < 0) break;
n++;
i = pt;
}
return this.addXInt (n);
}var counts =  new J.util.JmolList ();
var last = null;
var count = null;
var xList = J.script.SV.getVariable (x.value).sortOrReverse (0).getList ();
if (xList == null) return (match == null ? this.addXStr ("") : this.addXInt (0));
for (var i = 0, nLast = xList.size (); i <= nLast; i++) {
var a = (i == nLast ? null : xList.get (i));
if (match != null && a != null && !J.script.SV.areEqual (a, match)) continue;
if (J.script.SV.areEqual (a, last)) {
count.intValue++;
continue;
} else if (last != null) {
var y =  new J.util.JmolList ();
y.addLast (last);
y.addLast (count);
counts.addLast (J.script.SV.getVariableList (y));
}count = J.script.SV.newScriptVariableInt (1);
last = a;
}
if (match == null) return this.addXVar (J.script.SV.getVariableList (counts));
if (counts.isEmpty ()) return this.addXInt (0);
return this.addXVar (counts.get (0).getList ().get (1));
}, $fz.isPrivate = true, $fz), "~A,~N");
$_M(c$, "evaluateSymop", 
($fz = function (args, haveBitSet) {
if (args.length == 0) return false;
var x1 = (haveBitSet ? this.getX () : null);
if (x1 != null && x1.tok != 10) return false;
var bs = (x1 != null ? x1.value : args.length > 2 && args[1].tok == 10 ? args[1].value : this.viewer.getModelUndeletedAtomsBitSet (-1));
var xyz;
switch (args[0].tok) {
case 4:
xyz = J.script.SV.sValue (args[0]);
break;
case 12:
xyz = args[0].escape ();
break;
default:
xyz = null;
}
var iOp = (xyz == null ? args[0].asInt () : 0);
var pt = (args.length > 1 ? this.ptValue (args[1], true) : null);
if (args.length == 2 && !Float.isNaN (pt.x)) return this.addXObj (this.viewer.getSymmetryInfo (bs, xyz, iOp, pt, null, null, 135266320));
var desc = (args.length == 1 ? "" : J.script.SV.sValue (args[args.length - 1])).toLowerCase ();
var tok = 135176;
if (args.length == 1 || desc.equalsIgnoreCase ("matrix")) {
tok = 12;
} else if (desc.equalsIgnoreCase ("array") || desc.equalsIgnoreCase ("list")) {
tok = 1073742001;
} else if (desc.equalsIgnoreCase ("description")) {
tok = 1826248715;
} else if (desc.equalsIgnoreCase ("xyz")) {
tok = 1073741982;
} else if (desc.equalsIgnoreCase ("translation")) {
tok = 1073742178;
} else if (desc.equalsIgnoreCase ("axis")) {
tok = 1073741854;
} else if (desc.equalsIgnoreCase ("plane")) {
tok = 135266319;
} else if (desc.equalsIgnoreCase ("angle")) {
tok = 135266305;
} else if (desc.equalsIgnoreCase ("axispoint")) {
tok = 135266320;
} else if (desc.equalsIgnoreCase ("center")) {
tok = 12289;
}return this.addXObj (this.viewer.getSymmetryInfo (bs, xyz, iOp, pt, null, desc, tok));
}, $fz.isPrivate = true, $fz), "~A,~B");
$_M(c$, "evaluateBin", 
($fz = function (args) {
if (args.length != 3) return false;
var x1 = this.getX ();
var isListf = (x1.tok == 13);
if (!isListf && x1.tok != 7) return this.addXVar (x1);
var f0 = J.script.SV.fValue (args[0]);
var f1 = J.script.SV.fValue (args[1]);
var df = J.script.SV.fValue (args[2]);
var data;
if (isListf) {
data = x1.value;
} else {
var list = x1.getList ();
data =  Clazz.newFloatArray (list.size (), 0);
for (var i = list.size (); --i >= 0; ) data[i] = J.script.SV.fValue (list.get (i));

}var nbins = Clazz.doubleToInt (Math.floor ((f1 - f0) / df + 0.01));
var array =  Clazz.newIntArray (nbins, 0);
var nPoints = data.length;
for (var i = 0; i < nPoints; i++) {
var v = data[i];
var bin = Clazz.doubleToInt (Math.floor ((v - f0) / df));
if (bin < 0) bin = 0;
 else if (bin >= nbins) bin = nbins - 1;
array[bin]++;
}
return this.addXAI (array);
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluateHelix", 
($fz = function (args) {
if (args.length < 1 || args.length > 5) return false;
var pt = (args.length > 2 ? 3 : 1);
var type = (pt >= args.length ? "array" : J.script.SV.sValue (args[pt]));
var tok = J.script.T.getTokFromName (type);
if (args.length > 2) {
var pta = this.ptValue (args[0], true);
var ptb = this.ptValue (args[1], true);
if (args[2].tok != 9) return false;
var dq = J.util.Quaternion.newP4 (args[2].value);
switch (tok) {
case 0:
break;
case 135266320:
case 1073741854:
case 1666189314:
case 135266305:
case 1746538509:
return this.addXObj (J.util.Measure.computeHelicalAxis (null, tok, pta, ptb, dq));
case 135266306:
var data = J.util.Measure.computeHelicalAxis (null, 1073742001, pta, ptb, dq);
if (data == null) return false;
return this.addXAS (data);
default:
return this.addXObj (J.util.Measure.computeHelicalAxis (type, 135176, pta, ptb, dq));
}
} else {
var bs = (Clazz.instanceOf (args[0].value, J.util.BS) ? args[0].value : this.eval.compareInt (1095761937, 269484436, args[0].asInt ()));
switch (tok) {
case 135266320:
return this.addXObj (this.viewer.getHelixData (bs, 135266320));
case 1073741854:
return this.addXObj (this.viewer.getHelixData (bs, 1073741854));
case 1666189314:
return this.addXObj (this.viewer.getHelixData (bs, 1666189314));
case 135266305:
return this.addXFloat ((this.viewer.getHelixData (bs, 135266305)).floatValue ());
case 135176:
case 1746538509:
return this.addXObj (this.viewer.getHelixData (bs, tok));
case 135266306:
var data = this.viewer.getHelixData (bs, 1073742001);
if (data == null) return false;
return this.addXAS (data);
}
}return false;
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluateDot", 
($fz = function (args, tok) {
if (args.length != 1) return false;
var x1 = this.getX ();
var x2 = args[0];
var pt2 = this.ptValue (x2, true);
var plane2 = this.planeValue (x2);
if (x1.tok == 10 && tok != 1276117505) return this.addXObj (this.eval.getBitsetProperty (J.script.SV.bsSelectVar (x1), 1276118018, pt2, plane2, x1.value, null, false, x1.index, false));
var pt1 = this.ptValue (x1, true);
var plane1 = this.planeValue (x1);
if (tok == 1276117505) {
if (plane1 != null && plane2 != null) return this.addXFloat (plane1.x * plane2.x + plane1.y * plane2.y + plane1.z * plane2.z + plane1.w * plane2.w);
if (plane1 != null) pt1 = J.util.P3.new3 (plane1.x, plane1.y, plane1.z);
if (plane2 != null) pt2 = J.util.P3.new3 (plane2.x, plane2.y, plane2.z);
return this.addXFloat (pt1.x * pt2.x + pt1.y * pt2.y + pt1.z * pt2.z);
}if (plane1 == null) return this.addXFloat (plane2 == null ? pt2.distance (pt1) : J.util.Measure.distanceToPlane (plane2, pt1));
return this.addXFloat (J.util.Measure.distanceToPlane (plane1, pt2));
}, $fz.isPrivate = true, $fz), "~A,~N");
$_M(c$, "ptValue", 
function (x, allowFloat) {
var pt;
if (this.isSyntaxCheck) return  new J.util.P3 ();
switch (x.tok) {
case 8:
return x.value;
case 10:
return this.eval.getBitsetProperty (J.script.SV.bsSelectVar (x), 1146095626, null, null, x.value, null, false, 2147483647, false);
case 4:
pt = J.util.Escape.uP (J.script.SV.sValue (x));
if (Clazz.instanceOf (pt, J.util.P3)) return pt;
break;
case 7:
pt = J.util.Escape.uP ("{" + J.script.SV.sValue (x) + "}");
if (Clazz.instanceOf (pt, J.util.P3)) return pt;
break;
}
if (!allowFloat) return null;
var f = J.script.SV.fValue (x);
return J.util.P3.new3 (f, f, f);
}, "J.script.SV,~B");
$_M(c$, "planeValue", 
($fz = function (x) {
if (this.isSyntaxCheck) return  new J.util.P4 ();
switch (x.tok) {
case 9:
return x.value;
case 7:
case 4:
var pt = J.util.Escape.uP (J.script.SV.sValue (x));
return (Clazz.instanceOf (pt, J.util.P4) ? pt : null);
case 10:
break;
}
return null;
}, $fz.isPrivate = true, $fz), "J.script.T");
$_M(c$, "evaluateMeasure", 
($fz = function (args, tok) {
var nPoints = 0;
switch (tok) {
case 1746538509:
var points =  new J.util.JmolList ();
var rangeMinMax = [3.4028235E38, 3.4028235E38];
var strFormat = null;
var units = null;
var isAllConnected = false;
var isNotConnected = false;
var rPt = 0;
var isNull = false;
var rd = null;
var nBitSets = 0;
var vdw = 3.4028235E38;
var asArray = false;
for (var i = 0; i < args.length; i++) {
switch (args[i].tok) {
case 10:
var bs = args[i].value;
if (bs.length () == 0) isNull = true;
points.addLast (bs);
nPoints++;
nBitSets++;
break;
case 8:
var v =  new J.util.Point3fi ();
v.setT (args[i].value);
points.addLast (v);
nPoints++;
break;
case 2:
case 3:
rangeMinMax[rPt++ % 2] = J.script.SV.fValue (args[i]);
break;
case 4:
var s = J.script.SV.sValue (args[i]);
if (s.equalsIgnoreCase ("vdw") || s.equalsIgnoreCase ("vanderwaals")) vdw = (i + 1 < args.length && args[i + 1].tok == 2 ? args[++i].asInt () : 100) / 100;
 else if (s.equalsIgnoreCase ("notConnected")) isNotConnected = true;
 else if (s.equalsIgnoreCase ("connected")) isAllConnected = true;
 else if (s.equalsIgnoreCase ("minArray")) asArray = (nBitSets >= 1);
 else if (J.util.Parser.isOneOf (s.toLowerCase (), "nm;nanometers;pm;picometers;angstroms;ang;au")) units = s.toLowerCase ();
 else strFormat = nPoints + ":" + s;
break;
default:
return false;
}
}
if (nPoints < 2 || nPoints > 4 || rPt > 2 || isNotConnected && isAllConnected) return false;
if (isNull) return this.addXStr ("");
if (vdw != 3.4028235E38 && (nBitSets != 2 || nPoints != 2)) return this.addXStr ("");
rd = (vdw == 3.4028235E38 ?  new J.atomdata.RadiusData (rangeMinMax, 0, null, null) :  new J.atomdata.RadiusData (null, vdw, J.atomdata.RadiusData.EnumType.FACTOR, J.constant.EnumVdw.AUTO));
return this.addXObj (( new J.modelset.MeasurementData (this.viewer, points)).set (0, rd, strFormat, units, null, isAllConnected, isNotConnected, null, true).getMeasurements (asArray));
case 135266305:
if ((nPoints = args.length) != 3 && nPoints != 4) return false;
break;
default:
if ((nPoints = args.length) != 2) return false;
}
var pts =  new Array (nPoints);
for (var i = 0; i < nPoints; i++) pts[i] = this.ptValue (args[i], true);

switch (nPoints) {
case 2:
return this.addXFloat (pts[0].distance (pts[1]));
case 3:
return this.addXFloat (J.util.Measure.computeAngleABC (pts[0], pts[1], pts[2], true));
case 4:
return this.addXFloat (J.util.Measure.computeTorsion (pts[0], pts[1], pts[2], pts[3], true));
}
return false;
}, $fz.isPrivate = true, $fz), "~A,~N");
$_M(c$, "evaluateUserFunction", 
($fz = function (name, args, tok, isSelector) {
var x1 = null;
if (isSelector) {
x1 = this.getX ();
if (x1.tok != 10) return false;
}this.wasX = false;
var params =  new J.util.JmolList ();
for (var i = 0; i < args.length; i++) {
params.addLast (args[i]);
}
if (isSelector) {
return this.addXObj (this.eval.getBitsetProperty (J.script.SV.bsSelectVar (x1), tok, null, null, x1.value, [name, params], false, x1.index, false));
}var $var = this.eval.runFunctionRet (null, name, params, null, true, true, false);
return ($var == null ? false : this.addXVar ($var));
}, $fz.isPrivate = true, $fz), "~S,~A,~N,~B");
$_M(c$, "evaluateFind", 
($fz = function (args) {
if (args.length == 0) return false;
var x1 = this.getX ();
var sFind = J.script.SV.sValue (args[0]);
var flags = (args.length > 1 && args[1].tok != 1048589 && args[1].tok != 1048588 ? J.script.SV.sValue (args[1]) : "");
var isSequence = sFind.equalsIgnoreCase ("SEQUENCE");
var isSmiles = sFind.equalsIgnoreCase ("SMILES");
var isSearch = sFind.equalsIgnoreCase ("SMARTS");
var isMF = sFind.equalsIgnoreCase ("MF");
if (isSmiles || isSearch || x1.tok == 10) {
var iPt = (isSmiles || isSearch ? 2 : 1);
var bs2 = (iPt < args.length && args[iPt].tok == 10 ? args[iPt++].value : null);
var isAll = (args[args.length - 1].tok == 1048589);
var ret = null;
switch (x1.tok) {
case 4:
var smiles = J.script.SV.sValue (x1);
if (bs2 != null) return false;
if (flags.equalsIgnoreCase ("mf")) {
ret = this.viewer.getSmilesMatcher ().getMolecularFormula (smiles, isSearch);
if (ret == null) this.eval.evalError (this.viewer.getSmilesMatcher ().getLastException (), null);
} else {
ret = this.eval.getSmilesMatches (flags, smiles, null, null, isSearch, !isAll);
}break;
case 10:
if (isMF) return this.addXStr (J.util.JmolMolecule.getMolecularFormula (this.viewer.getModelSet ().atoms, x1.value, false));
if (isSequence) return this.addXStr (this.viewer.getSmiles (-1, -1, x1.value, true, isAll, isAll, false));
if (isSmiles || isSearch) sFind = flags;
var bsMatch3D = bs2;
ret = this.eval.getSmilesMatches (sFind, null, x1.value, bsMatch3D, !isSmiles, !isAll);
break;
}
if (ret == null) this.eval.error (22);
return this.addXObj (ret);
}var isReverse = (flags.indexOf ("v") >= 0);
var isCaseInsensitive = (flags.indexOf ("i") >= 0);
var asMatch = (flags.indexOf ("m") >= 0);
var isList = (x1.tok == 7);
var isPattern = (args.length == 2);
if (isList || isPattern) {
var pattern = null;
try {
pattern = java.util.regex.Pattern.compile (sFind, isCaseInsensitive ? 2 : 0);
} catch (e) {
if (Clazz.exceptionOf (e, Exception)) {
this.eval.evalError (e.toString (), null);
} else {
throw e;
}
}
var list = J.script.SV.listValue (x1);
if (J.util.Logger.debugging) J.util.Logger.debug ("finding " + sFind);
var bs =  new J.util.BS ();
var ipt = 0;
var n = 0;
var matcher = null;
var v = (asMatch ?  new J.util.JmolList () : null);
for (var i = 0; i < list.length; i++) {
var what = list[i];
matcher = pattern.matcher (what);
var isMatch = matcher.find ();
if (asMatch && isMatch || !asMatch && isMatch == !isReverse) {
n++;
ipt = i;
bs.set (i);
if (asMatch) v.addLast (isReverse ? what.substring (0, matcher.start ()) + what.substring (matcher.end ()) : matcher.group ());
}}
if (!isList) {
return (asMatch ? this.addXStr (v.size () == 1 ? v.get (0) : "") : isReverse ? this.addXBool (n == 1) : asMatch ? this.addXStr (n == 0 ? "" : matcher.group ()) : this.addXInt (n == 0 ? 0 : matcher.start () + 1));
}if (n == 1) return this.addXStr (asMatch ? v.get (0) : list[ipt]);
var listNew =  new Array (n);
if (n > 0) for (var i = list.length; --i >= 0; ) if (bs.get (i)) {
--n;
listNew[n] = (asMatch ? v.get (n) : list[i]);
}
return this.addXAS (listNew);
}return this.addXInt (J.script.SV.sValue (x1).indexOf (sFind) + 1);
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluateGetProperty", 
($fz = function (args) {
var pt = 0;
var propertyName = (args.length > pt ? J.script.SV.sValue (args[pt++]).toLowerCase () : "");
if (propertyName.startsWith ("$")) {
}var propertyValue;
if (propertyName.equalsIgnoreCase ("fileContents") && args.length > 2) {
var s = J.script.SV.sValue (args[1]);
for (var i = 2; i < args.length; i++) s += "|" + J.script.SV.sValue (args[i]);

propertyValue = s;
pt = args.length;
} else {
propertyValue = (args.length > pt && args[pt].tok == 10 ? J.script.SV.bsSelectVar (args[pt++]) : args.length > pt && args[pt].tok == 4 && this.viewer.checkPropertyParameter (propertyName) ? args[pt++].value : "");
}var property = this.viewer.getProperty (null, propertyName, propertyValue);
if (pt < args.length) property = this.viewer.extractProperty (property, args, pt);
return this.addXObj (J.script.SV.isVariableType (property) ? property : J.util.Escape.toReadable (propertyName, property));
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluatePlane", 
($fz = function (args, tok) {
if (tok == 135267841 && args.length != 3 || tok == 135267842 && args.length != 2 && args.length != 3 || args.length == 0 || args.length > 4) return false;
var pt1;
var pt2;
var pt3;
var plane;
var norm;
var vTemp;
switch (args.length) {
case 1:
if (args[0].tok == 10) {
var bs = J.script.SV.getBitSet (args[0], false);
if (bs.cardinality () == 3) {
var pts = this.viewer.getAtomPointVector (bs);
var vNorm =  new J.util.V3 ();
var vAB =  new J.util.V3 ();
var vAC =  new J.util.V3 ();
plane =  new J.util.P4 ();
J.util.Measure.getPlaneThroughPoints (pts.get (0), pts.get (1), pts.get (2), vNorm, vAB, vAC, plane);
return this.addXPt4 (plane);
}}var pt = J.util.Escape.uP (J.script.SV.sValue (args[0]));
if (Clazz.instanceOf (pt, J.util.P4)) return this.addXPt4 (pt);
return this.addXStr ("" + pt);
case 2:
if (tok == 135267842) {
if (args[1].tok != 9) return false;
pt3 =  new J.util.P3 ();
norm =  new J.util.V3 ();
vTemp =  new J.util.V3 ();
plane = args[1].value;
if (args[0].tok == 9) {
var list = J.util.Measure.getIntersectionPP (args[0].value, plane);
if (list == null) return this.addXStr ("");
return this.addXList (list);
}pt2 = this.ptValue (args[0], false);
if (pt2 == null) return this.addXStr ("");
return this.addXPt (J.util.Measure.getIntersection (pt2, null, plane, pt3, norm, vTemp));
}case 3:
case 4:
switch (tok) {
case 135267841:
return this.addXPt4 (this.eval.getHklPlane (J.util.P3.new3 (J.script.SV.fValue (args[0]), J.script.SV.fValue (args[1]), J.script.SV.fValue (args[2]))));
case 135267842:
pt1 = this.ptValue (args[0], false);
pt2 = this.ptValue (args[1], false);
if (pt1 == null || pt2 == null) return this.addXStr ("");
var vLine = J.util.V3.newV (pt2);
vLine.normalize ();
if (args[2].tok == 9) {
pt3 =  new J.util.P3 ();
norm =  new J.util.V3 ();
vTemp =  new J.util.V3 ();
pt1 = J.util.Measure.getIntersection (pt1, vLine, args[2].value, pt3, norm, vTemp);
if (pt1 == null) return this.addXStr ("");
return this.addXPt (pt1);
}pt3 = this.ptValue (args[2], false);
if (pt3 == null) return this.addXStr ("");
var v =  new J.util.V3 ();
J.util.Measure.projectOntoAxis (pt3, pt1, vLine, v);
return this.addXPt (pt3);
}
switch (args[0].tok) {
case 2:
case 3:
if (args.length == 3) {
var r = J.script.SV.fValue (args[0]);
var theta = J.script.SV.fValue (args[1]);
var phi = J.script.SV.fValue (args[2]);
norm = J.util.V3.new3 (0, 0, 1);
pt2 = J.util.P3.new3 (0, 1, 0);
var q = J.util.Quaternion.newVA (pt2, phi);
q.getMatrix ().transform (norm);
pt2.set (0, 0, 1);
q = J.util.Quaternion.newVA (pt2, theta);
q.getMatrix ().transform (norm);
pt2.setT (norm);
pt2.scale (r);
plane =  new J.util.P4 ();
J.util.Measure.getPlaneThroughPoint (pt2, norm, plane);
return this.addXPt4 (plane);
}break;
case 10:
case 8:
pt1 = this.ptValue (args[0], false);
pt2 = this.ptValue (args[1], false);
if (pt2 == null) return false;
pt3 = (args.length > 2 && (args[2].tok == 10 || args[2].tok == 8) ? this.ptValue (args[2], false) : null);
norm = J.util.V3.newV (pt2);
if (pt3 == null) {
plane =  new J.util.P4 ();
if (args.length == 2 || !args[2].asBoolean ()) {
pt3 = J.util.P3.newP (pt1);
pt3.add (pt2);
pt3.scale (0.5);
norm.sub (pt1);
norm.normalize ();
} else {
pt3 = pt1;
}J.util.Measure.getPlaneThroughPoint (pt3, norm, plane);
return this.addXPt4 (plane);
}var vAB =  new J.util.V3 ();
var vAC =  new J.util.V3 ();
var nd = J.util.Measure.getDirectedNormalThroughPoints (pt1, pt2, pt3, (args.length == 4 ? this.ptValue (args[3], true) : null), norm, vAB, vAC);
return this.addXPt4 (J.util.P4.new4 (norm.x, norm.y, norm.z, nd));
}
}
if (args.length != 4) return false;
var x = J.script.SV.fValue (args[0]);
var y = J.script.SV.fValue (args[1]);
var z = J.script.SV.fValue (args[2]);
var w = J.script.SV.fValue (args[3]);
return this.addXPt4 (J.util.P4.new4 (x, y, z, w));
}, $fz.isPrivate = true, $fz), "~A,~N");
$_M(c$, "evaluatePoint", 
($fz = function (args) {
if (args.length != 1 && args.length != 3 && args.length != 4) return false;
switch (args.length) {
case 1:
if (args[0].tok == 3 || args[0].tok == 2) return this.addXInt (args[0].asInt ());
var s = J.script.SV.sValue (args[0]);
if (args[0].tok == 7) s = "{" + s + "}";
var pt = J.util.Escape.uP (s);
if (Clazz.instanceOf (pt, J.util.P3)) return this.addXPt (pt);
return this.addXStr ("" + pt);
case 3:
return this.addXPt (J.util.P3.new3 (args[0].asFloat (), args[1].asFloat (), args[2].asFloat ()));
case 4:
return this.addXPt4 (J.util.P4.new4 (args[0].asFloat (), args[1].asFloat (), args[2].asFloat (), args[3].asFloat ()));
}
return false;
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluatePrompt", 
($fz = function (args) {
if (args.length != 1 && args.length != 2 && args.length != 3) return false;
var label = J.script.SV.sValue (args[0]);
var buttonArray = (args.length > 1 && args[1].tok == 7 ? J.script.SV.listValue (args[1]) : null);
var asButtons = (buttonArray != null || args.length == 1 || args.length == 3 && args[2].asBoolean ());
var input = (buttonArray != null ? null : args.length >= 2 ? J.script.SV.sValue (args[1]) : "OK");
var s = this.viewer.prompt (label, input, buttonArray, asButtons);
return (asButtons && buttonArray != null ? this.addXInt (Integer.parseInt (s) + 1) : this.addXStr (s));
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluateReplace", 
($fz = function (args) {
if (args.length != 2) return false;
var x = this.getX ();
var sFind = J.script.SV.sValue (args[0]);
var sReplace = J.script.SV.sValue (args[1]);
var s = (x.tok == 7 ? null : J.script.SV.sValue (x));
if (s != null) return this.addXStr (J.util.TextFormat.simpleReplace (s, sFind, sReplace));
var list = J.script.SV.listValue (x);
for (var i = list.length; --i >= 0; ) list[i] = J.util.TextFormat.simpleReplace (list[i], sFind, sReplace);

return this.addXAS (list);
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluateString", 
($fz = function (tok, args) {
if (args.length > 1) return false;
var x = this.getX ();
var s = (tok == 1276117508 && x.tok == 10 || tok == 1276117510 && x.tok == 7 ? null : J.script.SV.sValue (x));
var sArg = (args.length == 1 ? J.script.SV.sValue (args[0]) : tok == 1276117510 ? "" : "\n");
switch (tok) {
case 1276117508:
if (x.tok == 10) {
var bsSelected = J.script.SV.bsSelectVar (x);
sArg = "\n";
var modelCount = this.viewer.getModelCount ();
s = "";
for (var i = 0; i < modelCount; i++) {
s += (i == 0 ? "" : "\n");
var bs = this.viewer.getModelUndeletedAtomsBitSet (i);
bs.and (bsSelected);
s += J.util.Escape.eBS (bs);
}
}return this.addXAS (J.util.TextFormat.splitChars (s, sArg));
case 1276117506:
if (s.length > 0 && s.charAt (s.length - 1) == '\n') s = s.substring (0, s.length - 1);
return this.addXStr (J.util.TextFormat.simpleReplace (s, "\n", sArg));
case 1276117510:
if (s != null) return this.addXStr (J.util.TextFormat.trim (s, sArg));
var list = J.script.SV.listValue (x);
for (var i = list.length; --i >= 0; ) list[i] = J.util.TextFormat.trim (list[i], sArg);

return this.addXAS (list);
}
return this.addXStr ("");
}, $fz.isPrivate = true, $fz), "~N,~A");
$_M(c$, "evaluateList", 
($fz = function (tok, args) {
if (args.length != 1 && !(tok == 1276118017 && (args.length == 0 || args.length == 2))) return false;
var x1 = this.getX ();
var x2;
var len;
var sList1 = null;
var sList2 = null;
var sList3 = null;
if (args.length == 2) {
var itab = (args[0].tok == 4 ? 0 : 1);
var tab = J.script.SV.sValue (args[itab]);
sList1 = (x1.tok == 7 ? J.script.SV.listValue (x1) : J.util.TextFormat.split (J.script.SV.sValue (x1), '\n'));
x2 = args[1 - itab];
sList2 = (x2.tok == 7 ? J.script.SV.listValue (x2) : J.util.TextFormat.split (J.script.SV.sValue (x2), '\n'));
sList3 =  new Array (len = Math.max (sList1.length, sList2.length));
for (var i = 0; i < len; i++) sList3[i] = (i >= sList1.length ? "" : sList1[i]) + tab + (i >= sList2.length ? "" : sList2[i]);

return this.addXAS (sList3);
}x2 = (args.length == 0 ? J.script.SV.newVariable (1048579, "all") : args[0]);
var isAll = (x2.tok == 1048579);
if (x1.tok != 7 && x1.tok != 4) {
this.wasX = false;
this.addOp (J.script.T.tokenLeftParen);
this.addXVar (x1);
switch (tok) {
case 1276118017:
this.addOp (J.script.T.tokenPlus);
break;
case 1276117509:
this.addOp (J.script.T.tokenMinus);
break;
case 1276117507:
this.addOp (J.script.T.tokenTimes);
break;
case 1276117504:
this.addOp (J.script.T.tokenDivide);
break;
}
this.addXVar (x2);
return this.addOp (J.script.T.tokenRightParen);
}var isScalar = (x2.tok != 7 && J.script.SV.sValue (x2).indexOf ("\n") < 0);
var list1 = null;
var list2 = null;
var alist1 = x1.getList ();
var alist2 = x2.getList ();
if (x1.tok == 7) {
len = alist1.size ();
} else {
sList1 = (J.util.TextFormat.splitChars (x1.value, "\n"));
list1 =  Clazz.newFloatArray (len = sList1.length, 0);
J.util.Parser.parseFloatArrayData (sList1, list1);
}if (isAll) {
var sum = 0;
if (x1.tok == 7) {
for (var i = len; --i >= 0; ) sum += J.script.SV.fValue (alist1.get (i));

} else {
for (var i = len; --i >= 0; ) sum += list1[i];

}return this.addXFloat (sum);
}var scalar = null;
if (isScalar) {
scalar = x2;
} else if (x2.tok == 7) {
len = Math.min (len, alist2.size ());
} else {
sList2 = J.util.TextFormat.splitChars (x2.value, "\n");
list2 =  Clazz.newFloatArray (sList2.length, 0);
J.util.Parser.parseFloatArrayData (sList2, list2);
len = Math.min (list1.length, list2.length);
}var token = null;
switch (tok) {
case 1276118017:
token = J.script.T.tokenPlus;
break;
case 1276117509:
token = J.script.T.tokenMinus;
break;
case 1276117507:
token = J.script.T.tokenTimes;
break;
case 1276117504:
token = J.script.T.tokenDivide;
break;
}
var olist =  new Array (len);
for (var i = 0; i < len; i++) {
if (x1.tok == 7) this.addXVar (alist1.get (i));
 else if (Float.isNaN (list1[i])) this.addXObj (J.script.SV.unescapePointOrBitsetAsVariable (sList1[i]));
 else this.addXFloat (list1[i]);
if (isScalar) this.addXVar (scalar);
 else if (x2.tok == 7) this.addXVar (alist2.get (i));
 else if (Float.isNaN (list2[i])) this.addXObj (J.script.SV.unescapePointOrBitsetAsVariable (sList2[i]));
 else this.addXFloat (list2[i]);
if (!this.addOp (token) || !this.operate ()) return false;
olist[i] = this.xStack[this.xPt--];
}
return this.addXAV (olist);
}, $fz.isPrivate = true, $fz), "~N,~A");
$_M(c$, "evaluateRowCol", 
($fz = function (args, tok) {
if (args.length != 1) return false;
var n = args[0].asInt () - 1;
var x1 = this.getX ();
var f;
switch (x1.tok) {
case 11:
if (n < 0 || n > 2) return false;
var m = x1.value;
switch (tok) {
case 1276117513:
f =  Clazz.newFloatArray (3, 0);
m.getRow (n, f);
return this.addXAF (f);
case 1276117512:
default:
f =  Clazz.newFloatArray (3, 0);
m.getColumn (n, f);
return this.addXAF (f);
}
case 12:
if (n < 0 || n > 2) return false;
var m4 = x1.value;
switch (tok) {
case 1276117513:
f =  Clazz.newFloatArray (4, 0);
m4.getRow (n, f);
return this.addXAF (f);
case 1276117512:
default:
f =  Clazz.newFloatArray (4, 0);
m4.getColumn (n, f);
return this.addXAF (f);
}
}
return false;
}, $fz.isPrivate = true, $fz), "~A,~N");
$_M(c$, "evaluateArray", 
($fz = function (args, allowMatrix) {
var len = args.length;
if (allowMatrix && (len == 4 || len == 3)) {
var isMatrix = true;
for (var i = 0; i < len && isMatrix; i++) isMatrix = (args[i].tok == 7 && args[i].getList ().size () == len);

if (isMatrix) {
var m =  Clazz.newFloatArray (len * len, 0);
var pt = 0;
for (var i = 0; i < len && isMatrix; i++) {
var list = args[i].getList ();
for (var j = 0; j < len; j++) {
var x = J.script.SV.fValue (list.get (j));
if (Float.isNaN (x)) {
isMatrix = false;
break;
}m[pt++] = x;
}
}
if (isMatrix) {
if (len == 3) return this.addXM3 (J.util.Matrix3f.newA (m));
return this.addXM4 (J.util.Matrix4f.newA (m));
}}}var a =  new Array (args.length);
for (var i = a.length; --i >= 0; ) a[i] = J.script.SV.newScriptVariableToken (args[i]);

return this.addXAV (a);
}, $fz.isPrivate = true, $fz), "~A,~B");
$_M(c$, "evaluateMath", 
($fz = function (args, tok) {
if (tok == 135266318) {
if (args.length == 1 && args[0].tok == 4) return this.addXStr (( new java.util.Date ()) + "\t" + J.script.SV.sValue (args[0]));
return this.addXInt ((System.currentTimeMillis () & 0x7FFFFFFF) - (args.length == 0 ? 0 : args[0].asInt ()));
}if (args.length != 1) return false;
if (tok == 135266826) {
if (args[0].tok == 2) return this.addXInt (Math.abs (args[0].asInt ()));
return this.addXFloat (Math.abs (args[0].asFloat ()));
}var x = J.script.SV.fValue (args[0]);
switch (tok) {
case 135266819:
return this.addXFloat ((Math.acos (x) * 180 / 3.141592653589793));
case 135266821:
return this.addXFloat (Math.cos (x * 3.141592653589793 / 180));
case 135266820:
return this.addXFloat (Math.sin (x * 3.141592653589793 / 180));
case 135266822:
return this.addXFloat (Math.sqrt (x));
}
return false;
}, $fz.isPrivate = true, $fz), "~A,~N");
$_M(c$, "evaluateQuaternion", 
($fz = function (args, tok) {
var pt0 = null;
var nArgs = args.length;
var nMax = 2147483647;
var isRelative = false;
if (tok == 135270417) {
if (nArgs > 1 && args[nArgs - 1].tok == 4 && (args[nArgs - 1].value).equalsIgnoreCase ("relative")) {
nArgs--;
isRelative = true;
}if (nArgs > 1 && args[nArgs - 1].tok == 2 && args[0].tok == 10) {
nMax = args[nArgs - 1].asInt ();
if (nMax <= 0) nMax = 2147483646;
nArgs--;
}}switch (nArgs) {
case 0:
case 1:
case 4:
break;
case 2:
if (tok == 135270417) {
if (args[0].tok == 7 && args[1].tok == 7) break;
if (args[0].tok == 10 && (args[1].tok == 2 || args[1].tok == 10)) break;
}if ((pt0 = this.ptValue (args[0], false)) == null || tok != 135270417 && args[1].tok == 8) return false;
break;
case 3:
if (tok != 135270417) return false;
if (args[0].tok == 9) {
if (args[2].tok != 8 && args[2].tok != 10) return false;
break;
}for (var i = 0; i < 3; i++) if (args[i].tok != 8 && args[i].tok != 10) return false;

break;
default:
return false;
}
var q = null;
var qs = null;
var p4 = null;
switch (nArgs) {
case 0:
return this.addXPt4 (J.util.Quaternion.newQ (this.viewer.getRotationQuaternion ()).toPoint4f ());
case 1:
default:
if (tok == 135270417 && args[0].tok == 7) {
var data1 = J.script.ScriptMathProcessor.getQuaternionArray (args[0].getList (), 1073742001);
var mean = J.util.Quaternion.sphereMean (data1, null, 0.0001);
q = (Clazz.instanceOf (mean, J.util.Quaternion) ? mean : null);
break;
} else if (tok == 135270417 && args[0].tok == 10) {
qs = this.viewer.getAtomGroupQuaternions (args[0].value, nMax);
} else if (args[0].tok == 11) {
q = J.util.Quaternion.newM (args[0].value);
} else if (args[0].tok == 9) {
p4 = args[0].value;
} else {
var v = J.util.Escape.uP (J.script.SV.sValue (args[0]));
if (!(Clazz.instanceOf (v, J.util.P4))) return false;
p4 = v;
}if (tok == 135266307) q = J.util.Quaternion.newVA (J.util.P3.new3 (p4.x, p4.y, p4.z), p4.w);
break;
case 2:
if (tok == 135270417) {
if (args[0].tok == 7 && args[1].tok == 7) {
var data1 = J.script.ScriptMathProcessor.getQuaternionArray (args[0].getList (), 1073742001);
var data2 = J.script.ScriptMathProcessor.getQuaternionArray (args[1].getList (), 1073742001);
qs = J.util.Quaternion.div (data2, data1, nMax, isRelative);
break;
}if (args[0].tok == 10 && args[1].tok == 10) {
var data1 = this.viewer.getAtomGroupQuaternions (args[0].value, 2147483647);
var data2 = this.viewer.getAtomGroupQuaternions (args[1].value, 2147483647);
qs = J.util.Quaternion.div (data2, data1, nMax, isRelative);
break;
}}var pt1 = this.ptValue (args[1], false);
p4 = this.planeValue (args[0]);
if (pt1 != null) q = J.util.Quaternion.getQuaternionFrame (J.util.P3.new3 (0, 0, 0), pt0, pt1);
 else q = J.util.Quaternion.newVA (pt0, J.script.SV.fValue (args[1]));
break;
case 3:
if (args[0].tok == 9) {
var pt = (args[2].tok == 8 ? args[2].value : this.viewer.getAtomSetCenter (args[2].value));
return this.addXStr ((J.util.Quaternion.newP4 (args[0].value)).draw ("q", J.script.SV.sValue (args[1]), pt, 1));
}var pts =  new Array (3);
for (var i = 0; i < 3; i++) pts[i] = (args[i].tok == 8 ? args[i].value : this.viewer.getAtomSetCenter (args[i].value));

q = J.util.Quaternion.getQuaternionFrame (pts[0], pts[1], pts[2]);
break;
case 4:
if (tok == 135270417) p4 = J.util.P4.new4 (J.script.SV.fValue (args[1]), J.script.SV.fValue (args[2]), J.script.SV.fValue (args[3]), J.script.SV.fValue (args[0]));
 else q = J.util.Quaternion.newVA (J.util.P3.new3 (J.script.SV.fValue (args[0]), J.script.SV.fValue (args[1]), J.script.SV.fValue (args[2])), J.script.SV.fValue (args[3]));
break;
}
if (qs != null) {
if (nMax != 2147483647) {
var list =  new J.util.JmolList ();
for (var i = 0; i < qs.length; i++) list.addLast (qs[i].toPoint4f ());

return this.addXList (list);
}q = (qs.length > 0 ? qs[0] : null);
}return this.addXPt4 ((q == null ? J.util.Quaternion.newP4 (p4) : q).toPoint4f ());
}, $fz.isPrivate = true, $fz), "~A,~N");
$_M(c$, "evaluateRandom", 
($fz = function (args) {
if (args.length > 2) return false;
var lower = (args.length < 2 ? 0 : J.script.SV.fValue (args[0]));
var range = (args.length == 0 ? 1 : J.script.SV.fValue (args[args.length - 1]));
range -= lower;
return this.addXFloat ((Math.random () * range) + lower);
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluateCross", 
($fz = function (args) {
if (args.length != 2) return false;
var x1 = args[0];
var x2 = args[1];
if (x1.tok != 8 || x2.tok != 8) return false;
var a = J.util.V3.newV (x1.value);
var b = J.util.V3.newV (x2.value);
a.cross (a, b);
return this.addXPt (J.util.P3.newP (a));
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluateLoad", 
($fz = function (args, tok) {
if (args.length > 2 || args.length < 1) return false;
var file = J.script.SV.sValue (args[0]);
var nBytesMax = (args.length == 2 ? args[1].asInt () : 2147483647);
return this.addXStr (tok == 135271426 ? this.viewer.getFileAsString4 (file, nBytesMax, false, false) : this.viewer.getFilePath (file, false));
}, $fz.isPrivate = true, $fz), "~A,~N");
$_M(c$, "evaluateWrite", 
($fz = function (args) {
if (args.length == 0) return false;
return this.addXStr (this.eval.write (args));
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluateScript", 
($fz = function (args, tok) {
if (tok == 135287308 && args.length != 1 || args.length == 0 || args.length > 2) return false;
var s = J.script.SV.sValue (args[0]);
var sb =  new J.util.SB ();
switch (tok) {
case 135271429:
var appID = (args.length == 2 ? J.script.SV.sValue (args[1]) : ".");
if (!appID.equals (".")) sb.append (this.viewer.jsEval (appID + "\1" + s));
if (appID.equals (".") || appID.equals ("*")) this.eval.runScriptBuffer (s, sb);
break;
case 135287308:
sb.append (this.viewer.jsEval (s));
break;
}
s = sb.toString ();
var f;
return (Float.isNaN (f = J.util.Parser.parseFloatStrict (s)) ? this.addXStr (s) : s.indexOf (".") >= 0 ? this.addXFloat (f) : this.addXInt (J.util.Parser.parseInt (s)));
}, $fz.isPrivate = true, $fz), "~A,~N");
$_M(c$, "evaluateData", 
($fz = function (args) {
if (args.length != 1 && args.length != 2 && args.length != 4) return false;
var selected = J.script.SV.sValue (args[0]);
var type = (args.length == 2 ? J.script.SV.sValue (args[1]) : "");
if (args.length == 4) {
var iField = args[1].asInt ();
var nBytes = args[2].asInt ();
var firstLine = args[3].asInt ();
var f = J.util.Parser.extractData (selected, iField, nBytes, firstLine);
return this.addXStr (J.util.Escape.escapeFloatA (f, false));
}if (selected.indexOf ("data2d_") == 0) {
var f1 = this.viewer.getDataFloat2D (selected);
if (f1 == null) return this.addXStr ("");
if (args.length == 2 && args[1].tok == 2) {
var pt = args[1].intValue;
if (pt < 0) pt += f1.length;
if (pt >= 0 && pt < f1.length) return this.addXStr (J.util.Escape.escapeFloatA (f1[pt], false));
return this.addXStr ("");
}return this.addXStr (J.util.Escape.escapeFloatAA (f1, false));
}if (selected.indexOf ("property_") == 0) {
var f1 = this.viewer.getDataFloat (selected);
if (f1 == null) return this.addXStr ("");
var f2 = (type.indexOf ("property_") == 0 ? this.viewer.getDataFloat (type) : null);
if (f2 != null) {
f1 = J.util.ArrayUtil.arrayCopyF (f1, -1);
for (var i = Math.min (f1.length, f2.length); --i >= 0; ) f1[i] += f2[i];

}return this.addXStr (J.util.Escape.escapeFloatA (f1, false));
}if (args.length == 1) {
var data = this.viewer.getData (selected);
return this.addXStr (data == null ? "" : "" + data[1]);
}return this.addXStr (this.viewer.getData (selected, type));
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluateLabel", 
($fz = function (intValue, args) {
var x1 = (args.length < 2 ? this.getX () : null);
var format = (args.length == 0 ? "%U" : J.script.SV.sValue (args[0]));
var asArray = J.script.T.tokAttr (intValue, 480);
if (x1 == null) return this.addXStr (J.script.SV.sprintfArray (args));
var bs = J.script.SV.getBitSet (x1, true);
if (bs == null) return this.addXObj (J.script.SV.sprintf (J.util.TextFormat.formatCheck (format), x1));
return this.addXObj (this.eval.getBitsetIdent (bs, format, x1.value, true, x1.index, asArray));
}, $fz.isPrivate = true, $fz), "~N,~A");
$_M(c$, "evaluateWithin", 
($fz = function (args) {
if (args.length < 1 || args.length > 5) return false;
var i = args.length;
var distance = 0;
var withinSpec = args[0].value;
var withinStr = "" + withinSpec;
var tok = args[0].tok;
if (tok == 4) tok = J.script.T.getTokFromName (withinStr);
var isVdw = (tok == 1649412112);
if (isVdw) {
distance = 100;
withinSpec = null;
}var bs;
var isWithinModelSet = false;
var isWithinGroup = false;
var isDistance = (isVdw || tok == 3 || tok == 2);
var rd = null;
switch (tok) {
case 1048580:
if (i != 3 || !(Clazz.instanceOf (args[1].value, J.util.BS)) || !(Clazz.instanceOf (args[2].value, J.util.BS))) return false;
return this.addXBs (this.viewer.getBranchBitSet ((args[2].value).nextSetBit (0), (args[1].value).nextSetBit (0)));
case 135267336:
case 1238369286:
case 135267335:
var bsSelected = null;
var isOK = true;
switch (i) {
case 2:
break;
case 3:
isOK = (args[2].tok == 10);
if (isOK) bsSelected = args[2].value;
break;
default:
isOK = false;
}
if (!isOK) this.eval.error (22);
return this.addXObj (this.eval.getSmilesMatches (J.script.SV.sValue (args[1]), null, bsSelected, null, tok == 135267335, this.asBitSet));
}
if (Clazz.instanceOf (withinSpec, String)) {
if (tok == 0) {
tok = 1048614;
if (i > 2) return false;
i = 2;
}} else if (isDistance) {
if (!isVdw) distance = J.script.SV.fValue (args[0]);
if (i < 2) return false;
switch (tok = args[1].tok) {
case 1048589:
case 1048588:
isWithinModelSet = args[1].asBoolean ();
i = 0;
break;
case 4:
var s = J.script.SV.sValue (args[1]);
if (s.startsWith ("$")) return this.addXBs (this.eval.getAtomsNearSurface (distance, s.substring (1)));
isWithinGroup = (s.equalsIgnoreCase ("group"));
isVdw = (s.equalsIgnoreCase ("vanderwaals"));
if (isVdw) {
withinSpec = null;
tok = 1649412112;
} else {
tok = 1087373318;
}break;
}
} else {
return false;
}var pt = null;
var plane = null;
switch (i) {
case 1:
switch (tok) {
case 137363468:
case 3145760:
case 1679429641:
return this.addXBs (this.viewer.getAtomBits (tok, null));
case 1073741864:
return this.addXBs (this.viewer.getAtomBits (tok, ""));
case 1048614:
return this.addXBs (this.viewer.getAtomBits (1087373320, withinStr));
}
return false;
case 2:
switch (tok) {
case 1048614:
tok = 1087373320;
break;
case 1087375362:
case 1087375361:
case 1073741864:
case 1087373320:
return this.addXBs (this.viewer.getAtomBits (tok, J.script.SV.sValue (args[args.length - 1])));
}
break;
case 3:
switch (tok) {
case 1048589:
case 1048588:
case 1087373318:
case 1649412112:
case 135266319:
case 135267841:
case 1048582:
break;
case 1087373320:
withinStr = J.script.SV.sValue (args[2]);
break;
default:
return false;
}
break;
}
i = args.length - 1;
if (Clazz.instanceOf (args[i].value, J.util.P4)) {
plane = args[i].value;
} else if (Clazz.instanceOf (args[i].value, J.util.P3)) {
pt = args[i].value;
if (J.script.SV.sValue (args[1]).equalsIgnoreCase ("hkl")) plane = this.eval.getHklPlane (pt);
}if (i > 0 && plane == null && pt == null && !(Clazz.instanceOf (args[i].value, J.util.BS))) return false;
if (plane != null) return this.addXBs (this.viewer.getAtomsNearPlane (distance, plane));
if (pt != null) return this.addXBs (this.viewer.getAtomsNearPt (distance, pt));
bs = (args[i].tok == 10 ? J.script.SV.bsSelectVar (args[i]) : null);
if (tok == 1087373320) return this.addXBs (this.viewer.getSequenceBits (withinStr, bs));
if (bs == null) bs =  new J.util.BS ();
if (!isDistance) return this.addXBs (this.viewer.getAtomBits (tok, bs));
if (isWithinGroup) return this.addXBs (this.viewer.getGroupsWithin (Clazz.floatToInt (distance), bs));
if (isVdw) rd =  new J.atomdata.RadiusData (null, (distance > 10 ? distance / 100 : distance), (distance > 10 ? J.atomdata.RadiusData.EnumType.FACTOR : J.atomdata.RadiusData.EnumType.OFFSET), J.constant.EnumVdw.AUTO);
return this.addXBs (this.viewer.getAtomsWithinRadius (distance, bs, isWithinModelSet, rd));
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluateContact", 
($fz = function (args) {
if (args.length < 1 || args.length > 3) return false;
var i = 0;
var distance = 100;
var tok = args[0].tok;
switch (tok) {
case 3:
case 2:
distance = J.script.SV.fValue (args[i++]);
break;
case 10:
break;
default:
return false;
}
if (i == args.length || !(Clazz.instanceOf (args[i].value, J.util.BS))) return false;
var bsA = J.util.BSUtil.copy (J.script.SV.bsSelectVar (args[i++]));
if (this.isSyntaxCheck) return this.addXBs ( new J.util.BS ());
var bsB = (i < args.length ? J.util.BSUtil.copy (J.script.SV.bsSelectVar (args[i])) : null);
var rd =  new J.atomdata.RadiusData (null, (distance > 10 ? distance / 100 : distance), (distance > 10 ? J.atomdata.RadiusData.EnumType.FACTOR : J.atomdata.RadiusData.EnumType.OFFSET), J.constant.EnumVdw.AUTO);
bsB = this.eval.setContactBitSets (bsA, bsB, true, NaN, rd, false);
bsB.or (bsA);
return this.addXBs (bsB);
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluateColor", 
($fz = function (args) {
var colorScheme = (args.length > 0 ? J.script.SV.sValue (args[0]) : "");
if (colorScheme.equalsIgnoreCase ("hsl") && args.length == 2) {
var pt = J.util.P3.newP (J.script.SV.ptValue (args[1]));
var hsl =  Clazz.newFloatArray (3, 0);
J.util.ColorEncoder.RGBtoHSL (pt.x, pt.y, pt.z, hsl);
pt.set (hsl[0] * 360, hsl[1] * 100, hsl[2] * 100);
return this.addXPt (pt);
}var isIsosurface = colorScheme.startsWith ("$");
var ce = (isIsosurface ? null : this.viewer.getColorEncoder (colorScheme));
if (!isIsosurface && ce == null) return this.addXStr ("");
var lo = (args.length > 1 ? J.script.SV.fValue (args[1]) : 3.4028235E38);
var hi = (args.length > 2 ? J.script.SV.fValue (args[2]) : 3.4028235E38);
var value = (args.length > 3 ? J.script.SV.fValue (args[3]) : 3.4028235E38);
var getValue = (value != 3.4028235E38 || lo != 3.4028235E38 && hi == 3.4028235E38);
var haveRange = (hi != 3.4028235E38);
if (!haveRange && colorScheme.length == 0) {
value = lo;
var range = this.viewer.getCurrentColorRange ();
lo = range[0];
hi = range[1];
}if (isIsosurface) {
var id = colorScheme.substring (1);
var data = [id, null];
if (!this.viewer.getShapePropertyData (24, "colorEncoder", data)) return this.addXStr ("");
ce = data[1];
} else {
ce.setRange (lo, hi, lo > hi);
}var key = ce.getColorKey ();
if (getValue) return this.addXPt (J.util.ColorUtil.colorPointFromInt2 (ce.getArgb (hi == 3.4028235E38 ? lo : value)));
return this.addXVar (J.script.SV.getVariableMap (key));
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluateConnected", 
($fz = function (args) {
if (args.length > 5) return false;
var min = -2147483648;
var max = 2147483647;
var fmin = 0;
var fmax = 3.4028235E38;
var order = 65535;
var atoms1 = null;
var atoms2 = null;
var haveDecimal = false;
var isBonds = false;
for (var i = 0; i < args.length; i++) {
var $var = args[i];
switch ($var.tok) {
case 10:
isBonds = (Clazz.instanceOf ($var.value, J.modelset.Bond.BondSet));
if (isBonds && atoms1 != null) return false;
if (atoms1 == null) atoms1 = J.script.SV.bsSelectVar ($var);
 else if (atoms2 == null) atoms2 = J.script.SV.bsSelectVar ($var);
 else return false;
break;
case 4:
var type = J.script.SV.sValue ($var);
if (type.equalsIgnoreCase ("hbond")) order = 30720;
 else order = J.script.ScriptEvaluator.getBondOrderFromString (type);
if (order == 131071) return false;
break;
case 3:
haveDecimal = true;
default:
var n = $var.asInt ();
var f = $var.asFloat ();
if (max != 2147483647) return false;
if (min == -2147483648) {
min = Math.max (n, 0);
fmin = f;
} else {
max = n;
fmax = f;
}}
}
if (min == -2147483648) {
min = 1;
max = 100;
fmin = 0.1;
fmax = 1.0E8;
} else if (max == 2147483647) {
max = min;
fmax = fmin;
fmin = 0.1;
}if (atoms1 == null) atoms1 = this.viewer.getModelUndeletedAtomsBitSet (-1);
if (haveDecimal && atoms2 == null) atoms2 = atoms1;
if (atoms2 != null) {
var bsBonds =  new J.util.BS ();
this.viewer.makeConnections (fmin, fmax, order, 1087373321, atoms1, atoms2, bsBonds, isBonds, false, 0);
return this.addXVar (J.script.SV.newVariable (10,  new J.modelset.Bond.BondSet (bsBonds, this.viewer.getAtomIndices (this.viewer.getAtomBits (1678770178, bsBonds)))));
}return this.addXBs (this.viewer.getAtomsConnected (min, max, order, atoms1));
}, $fz.isPrivate = true, $fz), "~A");
$_M(c$, "evaluateSubstructure", 
($fz = function (args, tok) {
if (args.length == 0) return false;
var bs =  new J.util.BS ();
var pattern = J.script.SV.sValue (args[0]);
if (pattern.length > 0) try {
var bsSelected = (args.length == 2 && args[1].tok == 10 ? J.script.SV.bsSelectVar (args[1]) : null);
bs = this.viewer.getSmilesMatcher ().getSubstructureSet (pattern, this.viewer.getModelSet ().atoms, this.viewer.getAtomCount (), bsSelected, tok != 135267336 && tok != 1238369286, false);
} catch (e) {
if (Clazz.exceptionOf (e, Exception)) {
this.eval.evalError (e.toString (), null);
} else {
throw e;
}
}
return this.addXBs (bs);
}, $fz.isPrivate = true, $fz), "~A,~N");
$_M(c$, "operate", 
($fz = function () {
var op = this.oStack[this.oPt--];
var pt;
var pt4;
var m;
var s;
var f;
if (this.logMessages) {
this.dumpStacks ("operate: " + op);
}if (this.isArrayItem && this.squareCount == 0 && this.equalCount == 1 && this.oPt < 0 && (op.tok == 269484436)) {
return true;
}var x2 = this.getX ();
if (x2 === J.script.T.tokenArraySelector) return false;
if (x2.tok == 7 || x2.tok == 11 || x2.tok == 12) x2 = J.script.SV.selectItemVar (x2);
if (op.tok == 269484225 || op.tok == 269484226) {
if (!this.isSyntaxCheck && !x2.increment (this.incrementX)) return false;
this.wasX = true;
this.putX (x2);
return true;
}if (op.tok == 269484144) {
if (this.isSyntaxCheck) return this.addXBool (true);
switch (x2.tok) {
case 9:
return this.addXPt4 ((J.util.Quaternion.newP4 (x2.value)).inv ().toPoint4f ());
case 11:
m = J.util.Matrix3f.newM (x2.value);
m.invert ();
return this.addXM3 (m);
case 12:
var m4 = J.util.Matrix4f.newM (x2.value);
m4.invert ();
return this.addXM4 (m4);
case 10:
return this.addXBs (J.util.BSUtil.copyInvert (J.script.SV.bsSelectVar (x2), (Clazz.instanceOf (x2.value, J.modelset.Bond.BondSet) ? this.viewer.getBondCount () : this.viewer.getAtomCount ())));
default:
return this.addXBool (!x2.asBoolean ());
}
}var iv = op.intValue & -481;
if (op.tok == 269484241) {
switch (iv) {
case 1073741824:
return this.getAllProperties (x2, op.value);
case 1141899267:
case 1276117011:
case 1141899270:
if (iv == 1141899267 && Clazz.instanceOf (x2.value, J.modelset.Bond.BondSet)) break;
return this.addXInt (J.script.SV.sizeOf (x2));
case 1141899272:
return this.addXStr (J.script.ScriptMathProcessor.typeOf (x2));
case 1141899281:
if (x2.tok != 6) return this.addXStr ("");
var keyset = (x2.value).keySet ();
var keys = keyset.toArray ( new Array (keyset.size ()));
java.util.Arrays.sort (keys);
return this.addXAS (keys);
case 1141899268:
switch (x2.tok) {
case 11:
case 12:
s = J.script.SV.sValue (x2);
s = J.util.TextFormat.simpleReplace (s.substring (1, s.length - 1), "],[", "]\n[");
break;
case 4:
s = x2.value;
break;
default:
s = J.script.SV.sValue (x2);
}
s = J.util.TextFormat.simpleReplace (s, "\n\r", "\n").$replace ('\r', '\n');
return this.addXAS (J.util.TextFormat.split (s, '\n'));
case 1766856708:
switch (x2.tok) {
case 4:
case 7:
s = J.script.SV.sValue (x2);
pt =  new J.util.P3 ();
return this.addXPt (J.util.ColorUtil.colorPointFromString (s, pt));
case 2:
case 3:
return this.addXPt (this.viewer.getColorPointForPropertyValue (J.script.SV.fValue (x2)));
case 8:
return this.addXStr (J.util.Escape.escapeColor (J.util.ColorUtil.colorPtToInt (x2.value)));
default:
}
break;
case 1679429641:
return (this.isSyntaxCheck ? this.addXStr ("x") : this.getBoundBox (x2));
}
if (this.isSyntaxCheck) return this.addXStr (J.script.SV.sValue (x2));
if (x2.tok == 4) {
var v = J.script.SV.unescapePointOrBitsetAsVariable (J.script.SV.sValue (x2));
if (!(Clazz.instanceOf (v, J.script.SV))) return false;
x2 = v;
}if (op.tok == x2.tok) x2 = this.getX ();
return this.getPointOrBitsetOperation (op, x2);
}var x1 = this.getX ();
if (this.isSyntaxCheck) {
if (op === J.script.T.tokenAndFALSE || op === J.script.T.tokenOrTRUE) this.isSyntaxCheck = false;
return this.addXVar (J.script.SV.newScriptVariableToken (x1));
}switch (op.tok) {
case 269484160:
case 269484128:
switch (x1.tok) {
case 10:
var bs = J.script.SV.bsSelectVar (x1);
switch (x2.tok) {
case 10:
bs = J.util.BSUtil.copy (bs);
bs.and (J.script.SV.bsSelectVar (x2));
return this.addXBs (bs);
case 2:
var x = x2.asInt ();
return (this.addXBool (x < 0 ? false : bs.get (x)));
}
break;
}
return this.addXBool (x1.asBoolean () && x2.asBoolean ());
case 269484112:
switch (x1.tok) {
case 10:
var bs = J.util.BSUtil.copy (J.script.SV.bsSelectVar (x1));
switch (x2.tok) {
case 10:
bs.or (J.script.SV.bsSelectVar (x2));
return this.addXBs (bs);
case 2:
var x = x2.asInt ();
if (x < 0) break;
bs.set (x);
return this.addXBs (bs);
case 7:
var sv = x2.value;
for (var i = sv.size (); --i >= 0; ) {
var b = sv.get (i).asInt ();
if (b >= 0) bs.set (b);
}
return this.addXBs (bs);
}
break;
case 7:
return this.addXVar (J.script.SV.concatList (x1, x2, false));
}
return this.addXBool (x1.asBoolean () || x2.asBoolean ());
case 269484113:
if (x1.tok == 10 && x2.tok == 10) {
var bs = J.util.BSUtil.copy (J.script.SV.bsSelectVar (x1));
bs.xor (J.script.SV.bsSelectVar (x2));
return this.addXBs (bs);
}var a = x1.asBoolean ();
var b = x2.asBoolean ();
return this.addXBool (a && !b || b && !a);
case 269484114:
if (x1.tok != 10 || x2.tok != 10) return false;
return this.addXBs (J.util.BSUtil.toggleInPlace (J.util.BSUtil.copy (J.script.SV.bsSelectVar (x1)), J.script.SV.bsSelectVar (x2)));
case 269484434:
return this.addXBool (x1.asFloat () <= x2.asFloat ());
case 269484433:
return this.addXBool (x1.asFloat () >= x2.asFloat ());
case 269484432:
return this.addXBool (x1.asFloat () > x2.asFloat ());
case 269484435:
return this.addXBool (x1.asFloat () < x2.asFloat ());
case 269484436:
return this.addXBool (J.script.SV.areEqual (x1, x2));
case 269484438:
return this.addXBool (!J.script.SV.areEqual (x1, x2));
case 269484193:
switch (x1.tok) {
default:
return this.addXFloat (x1.asFloat () + x2.asFloat ());
case 7:
return this.addXVar (J.script.SV.concatList (x1, x2, true));
case 2:
switch (x2.tok) {
case 4:
if ((s = (J.script.SV.sValue (x2)).trim ()).indexOf (".") < 0 && s.indexOf ("+") <= 0 && s.lastIndexOf ("-") <= 0) return this.addXInt (x1.intValue + x2.asInt ());
break;
case 3:
return this.addXFloat (x1.intValue + x2.asFloat ());
}
return this.addXInt (x1.intValue + x2.asInt ());
case 4:
return this.addXVar (J.script.SV.newVariable (4, J.script.SV.sValue (x1) + J.script.SV.sValue (x2)));
case 9:
var q1 = J.util.Quaternion.newP4 (x1.value);
switch (x2.tok) {
default:
return this.addXPt4 (q1.add (x2.asFloat ()).toPoint4f ());
case 9:
return this.addXPt4 (q1.mulQ (J.util.Quaternion.newP4 (x2.value)).toPoint4f ());
}
case 8:
pt = J.util.P3.newP (x1.value);
switch (x2.tok) {
case 8:
pt.add (x2.value);
return this.addXPt (pt);
case 9:
pt4 = x2.value;
pt.add (J.util.P3.new3 (pt4.x, pt4.y, pt4.z));
return this.addXPt (pt);
default:
f = x2.asFloat ();
return this.addXPt (J.util.P3.new3 (pt.x + f, pt.y + f, pt.z + f));
}
case 11:
switch (x2.tok) {
default:
return this.addXFloat (x1.asFloat () + x2.asFloat ());
case 11:
m = J.util.Matrix3f.newM (x1.value);
m.add (x2.value);
return this.addXM3 (m);
case 8:
return this.addXM4 (J.script.ScriptMathProcessor.getMatrix4f (x1.value, x2.value));
}
}
case 269484192:
if (x1.tok == 2) {
if (x2.tok == 4) {
if ((s = (J.script.SV.sValue (x2)).trim ()).indexOf (".") < 0 && s.indexOf ("+") <= 0 && s.lastIndexOf ("-") <= 0) return this.addXInt (x1.intValue - x2.asInt ());
} else if (x2.tok != 3) return this.addXInt (x1.intValue - x2.asInt ());
}if (x1.tok == 4 && x2.tok == 2) {
if ((s = (J.script.SV.sValue (x1)).trim ()).indexOf (".") < 0 && s.indexOf ("+") <= 0 && s.lastIndexOf ("-") <= 0) return this.addXInt (x1.asInt () - x2.intValue);
}switch (x1.tok) {
default:
return this.addXFloat (x1.asFloat () - x2.asFloat ());
case 6:
var ht =  new java.util.Hashtable (x1.value);
ht.remove (J.script.SV.sValue (x2));
return this.addXVar (J.script.SV.getVariableMap (ht));
case 11:
switch (x2.tok) {
default:
return this.addXFloat (x1.asFloat () - x2.asFloat ());
case 11:
m = J.util.Matrix3f.newM (x1.value);
m.sub (x2.value);
return this.addXM3 (m);
}
case 12:
switch (x2.tok) {
default:
return this.addXFloat (x1.asFloat () - x2.asFloat ());
case 12:
var m4 = J.util.Matrix4f.newM (x1.value);
m4.sub (x2.value);
return this.addXM4 (m4);
}
case 8:
pt = J.util.P3.newP (x1.value);
switch (x2.tok) {
default:
f = x2.asFloat ();
return this.addXPt (J.util.P3.new3 (pt.x - f, pt.y - f, pt.z - f));
case 8:
pt.sub (x2.value);
return this.addXPt (pt);
case 9:
pt4 = x2.value;
pt.sub (J.util.P3.new3 (pt4.x, pt4.y, pt4.z));
return this.addXPt (pt);
}
case 9:
var q1 = J.util.Quaternion.newP4 (x1.value);
switch (x2.tok) {
default:
return this.addXPt4 (q1.add (-x2.asFloat ()).toPoint4f ());
case 9:
var q2 = J.util.Quaternion.newP4 (x2.value);
return this.addXPt4 (q2.mulQ (q1.inv ()).toPoint4f ());
}
}
case 269484224:
switch (x2.tok) {
default:
return this.addXFloat (-x2.asFloat ());
case 2:
return this.addXInt (-x2.asInt ());
case 8:
pt = J.util.P3.newP (x2.value);
pt.scale (-1.0);
return this.addXPt (pt);
case 9:
pt4 = J.util.P4.newPt (x2.value);
pt4.scale (-1.0);
return this.addXPt4 (pt4);
case 11:
m = J.util.Matrix3f.newM (x2.value);
m.transpose ();
return this.addXM3 (m);
case 12:
var m4 = J.util.Matrix4f.newM (x2.value);
m4.transpose ();
return this.addXM4 (m4);
case 10:
return this.addXBs (J.util.BSUtil.copyInvert (J.script.SV.bsSelectVar (x2), (Clazz.instanceOf (x2.value, J.modelset.Bond.BondSet) ? this.viewer.getBondCount () : this.viewer.getAtomCount ())));
}
case 269484209:
if (x1.tok == 2 && x2.tok != 3) return this.addXInt (x1.intValue * x2.asInt ());
pt = (x1.tok == 11 ? this.ptValue (x2, false) : x2.tok == 11 ? this.ptValue (x1, false) : null);
pt4 = (x1.tok == 12 ? this.planeValue (x2) : x2.tok == 12 ? this.planeValue (x1) : null);
switch (x2.tok) {
case 11:
if (pt != null) {
var m3b = J.util.Matrix3f.newM (x2.value);
m3b.transpose ();
m3b.transform (pt);
if (x1.tok == 7) return this.addXVar (J.script.SV.getVariableAF ([pt.x, pt.y, pt.z]));
return this.addXPt (pt);
}if (pt4 != null) {
return this.addXPt4 ((J.util.Quaternion.newP4 (pt4).mulQ (J.util.Quaternion.newM (x2.value))).toPoint4f ());
}break;
case 12:
if (pt4 != null) {
var m4b = J.util.Matrix4f.newM (x2.value);
m4b.transpose ();
m4b.transform4 (pt4);
if (x1.tok == 7) return this.addXVar (J.script.SV.getVariableAF ([pt4.x, pt4.y, pt4.z, pt4.w]));
return this.addXPt4 (pt4);
}break;
}
switch (x1.tok) {
default:
return this.addXFloat (x1.asFloat () * x2.asFloat ());
case 11:
var m3 = x1.value;
if (pt != null) {
m3.transform (pt);
if (x2.tok == 7) return this.addXVar (J.script.SV.getVariableAF ([pt.x, pt.y, pt.z]));
return this.addXPt (pt);
}switch (x2.tok) {
case 11:
m = J.util.Matrix3f.newM (x2.value);
m.mul2 (m3, m);
return this.addXM3 (m);
case 9:
return this.addXM3 (J.util.Quaternion.newM (m3).mulQ (J.util.Quaternion.newP4 (x2.value)).getMatrix ());
default:
f = x2.asFloat ();
var aa =  new J.util.AxisAngle4f ();
aa.setM (m3);
aa.angle *= f;
var m2 =  new J.util.Matrix3f ();
m2.setAA (aa);
return this.addXM3 (m2);
}
case 12:
var m4 = x1.value;
if (pt != null) {
m4.transform (pt);
if (x2.tok == 7) return this.addXVar (J.script.SV.getVariableAF ([pt.x, pt.y, pt.z]));
return this.addXPt (pt);
}if (pt4 != null) {
m4.transform4 (pt4);
if (x2.tok == 7) return this.addXVar (J.script.SV.getVariableAF ([pt4.x, pt4.y, pt4.z, pt4.w]));
return this.addXPt4 (pt4);
}switch (x2.tok) {
case 12:
var m4b = J.util.Matrix4f.newM (x2.value);
m4b.mul2 (m4, m4b);
return this.addXM4 (m4b);
default:
return this.addXStr ("NaN");
}
case 8:
pt = J.util.P3.newP (x1.value);
switch (x2.tok) {
case 8:
var pt2 = (x2.value);
return this.addXFloat (pt.x * pt2.x + pt.y * pt2.y + pt.z * pt2.z);
default:
f = x2.asFloat ();
return this.addXPt (J.util.P3.new3 (pt.x * f, pt.y * f, pt.z * f));
}
case 9:
switch (x2.tok) {
case 9:
return this.addXPt4 (J.util.Quaternion.newP4 (x1.value).mulQ (J.util.Quaternion.newP4 (x2.value)).toPoint4f ());
}
return this.addXPt4 (J.util.Quaternion.newP4 (x1.value).mul (x2.asFloat ()).toPoint4f ());
}
case 269484210:
s = null;
var n = x2.asInt ();
switch (x1.tok) {
case 1048589:
case 1048588:
case 2:
default:
if (n == 0) return this.addXInt (0);
return this.addXInt (x1.asInt () % n);
case 3:
f = x1.asFloat ();
if (n == 0) return this.addXInt (Math.round (f));
s = J.util.TextFormat.formatDecimal (f, n);
return this.addXStr (s);
case 4:
s = x1.value;
if (n == 0) return this.addXStr (J.util.TextFormat.trim (s, "\n\t "));
if (n == 9999) return this.addXStr (s.toUpperCase ());
if (n == -9999) return this.addXStr (s.toLowerCase ());
if (n > 0) return this.addXStr (J.util.TextFormat.formatS (s, n, n, false, false));
return this.addXStr (J.util.TextFormat.formatS (s, n, n - 1, true, false));
case 7:
var list = J.script.SV.listValue (x1);
for (var i = 0; i < list.length; i++) {
if (n == 0) list[i] = list[i].trim ();
 else if (n > 0) list[i] = J.util.TextFormat.formatS (list[i], n, n, true, false);
 else list[i] = J.util.TextFormat.formatS (s, -n, n, false, false);
}
return this.addXAS (list);
case 8:
pt = J.util.P3.newP (x1.value);
this.viewer.toUnitCell (pt, J.util.P3.new3 (n, n, n));
return this.addXPt (pt);
case 9:
pt4 = x1.value;
if (x2.tok == 8) return this.addXPt ((J.util.Quaternion.newP4 (pt4)).transformPt (x2.value));
if (x2.tok == 9) {
var v4 = J.util.P4.newPt (x2.value);
(J.util.Quaternion.newP4 (pt4)).getThetaDirected (v4);
return this.addXPt4 (v4);
}switch (n) {
case 0:
return this.addXFloat (pt4.w);
case 1:
return this.addXFloat (pt4.x);
case 2:
return this.addXFloat (pt4.y);
case 3:
return this.addXFloat (pt4.z);
case 4:
return this.addXPt (J.util.P3.newP ((J.util.Quaternion.newP4 (pt4)).getNormal ()));
case -1:
return this.addXPt (J.util.P3.newP (J.util.Quaternion.newP4 (pt4).getVector (-1)));
case -2:
return this.addXFloat ((J.util.Quaternion.newP4 (pt4)).getTheta ());
case -3:
return this.addXPt (J.util.P3.newP ((J.util.Quaternion.newP4 (pt4)).getVector (0)));
case -4:
return this.addXPt (J.util.P3.newP ((J.util.Quaternion.newP4 (pt4)).getVector (1)));
case -5:
return this.addXPt (J.util.P3.newP ((J.util.Quaternion.newP4 (pt4)).getVector (2)));
case -6:
var ax = (J.util.Quaternion.newP4 (pt4)).toAxisAngle4f ();
return this.addXPt4 (J.util.P4.new4 (ax.x, ax.y, ax.z, (ax.angle * 180 / 3.141592653589793)));
case -9:
return this.addXM3 ((J.util.Quaternion.newP4 (pt4)).getMatrix ());
default:
return this.addXPt4 (pt4);
}
case 12:
var m4 = x1.value;
switch (n) {
case 1:
var m3 =  new J.util.Matrix3f ();
m4.getRotationScale (m3);
return this.addXM3 (m3);
case 2:
var v3 =  new J.util.V3 ();
m4.get (v3);
return this.addXPt (J.util.P3.newP (v3));
default:
return false;
}
case 10:
return this.addXBs (J.script.SV.bsSelectRange (x1, n));
}
case 269484208:
if (x1.tok == 2 && x2.tok == 2 && x2.intValue != 0) return this.addXInt (Clazz.doubleToInt (x1.intValue / x2.intValue));
var f2 = x2.asFloat ();
switch (x1.tok) {
default:
var f1 = x1.asFloat ();
return this.addXFloat (f1 / f2);
case 8:
pt = J.util.P3.newP (x1.value);
if (f2 == 0) return this.addXPt (J.util.P3.new3 (NaN, NaN, NaN));
return this.addXPt (J.util.P3.new3 (pt.x / f2, pt.y / f2, pt.z / f2));
case 9:
if (x2.tok == 9) return this.addXPt4 (J.util.Quaternion.newP4 (x1.value).div (J.util.Quaternion.newP4 (x2.value)).toPoint4f ());
if (f2 == 0) return this.addXPt4 (J.util.P4.new4 (NaN, NaN, NaN, NaN));
return this.addXPt4 (J.util.Quaternion.newP4 (x1.value).mul (1 / f2).toPoint4f ());
}
case 269484211:
f = x2.asFloat ();
switch (x1.tok) {
default:
return this.addXInt (f == 0 ? 0 : Clazz.doubleToInt (Math.floor (x1.asFloat () / x2.asFloat ())));
case 9:
if (f == 0) return this.addXPt4 (J.util.P4.new4 (NaN, NaN, NaN, NaN));
if (x2.tok == 9) return this.addXPt4 (J.util.Quaternion.newP4 (x1.value).divLeft (J.util.Quaternion.newP4 (x2.value)).toPoint4f ());
return this.addXPt4 (J.util.Quaternion.newP4 (x1.value).mul (1 / f).toPoint4f ());
}
case 269484227:
f = Math.pow (x1.asFloat (), x2.asFloat ());
return (x1.tok == 2 && x2.tok == 2 ? this.addXInt (Clazz.floatToInt (f)) : this.addXFloat (f));
}
return true;
}, $fz.isPrivate = true, $fz));
c$.typeOf = $_M(c$, "typeOf", 
($fz = function (x) {
var tok = (x == null ? 0 : x.tok);
switch (tok) {
case 1048589:
case 1048588:
return "boolean";
case 10:
return (Clazz.instanceOf (x.value, J.modelset.Bond.BondSet) ? "bondset" : "bitset");
case 2:
case 3:
case 8:
case 9:
case 4:
case 7:
case 6:
case 11:
case 12:
return J.script.T.astrType[tok];
}
return "?";
}, $fz.isPrivate = true, $fz), "J.script.SV");
$_M(c$, "getAllProperties", 
($fz = function (x2, abbr) {
if (x2.tok != 10) return false;
if (this.isSyntaxCheck) return this.addXStr ("");
var bs = J.script.SV.bsSelectVar (x2);
var tokens;
var n = bs.cardinality ();
if (n == 0 || (tokens = J.script.T.getAtomPropertiesLike (abbr.substring (0, abbr.length - 1))) == null) return this.addXStr ("");
var ht =  new java.util.Hashtable ();
var index = (n == 1 ? bs.nextSetBit (0) : 2147483647);
for (var i = tokens.size (); --i >= 0; ) {
var t = tokens.get (i);
var tok = t.tok;
switch (tok) {
case 1095766022:
case 1095761925:
continue;
default:
if (index == 2147483647) tok |= 480;
ht.put (t.value, J.script.SV.getVariable (this.eval.getBitsetProperty (bs, tok, null, null, null, null, false, index, true)));
}
}
return this.addXMap (ht);
}, $fz.isPrivate = true, $fz), "J.script.SV,~S");
c$.getMatrix4f = $_M(c$, "getMatrix4f", 
function (matRotate, vTranslate) {
return J.util.Matrix4f.newMV (matRotate, vTranslate == null ?  new J.util.V3 () : J.util.V3.newV (vTranslate));
}, "J.util.Matrix3f,J.util.Tuple3f");
$_M(c$, "getBoundBox", 
($fz = function (x2) {
if (x2.tok != 10) return false;
if (this.isSyntaxCheck) return this.addXStr ("");
var b = this.viewer.getBoxInfo (J.script.SV.bsSelectVar (x2), 1);
var pts = b.getBoundBoxPoints (true);
var list =  new J.util.JmolList ();
for (var i = 0; i < 4; i++) list.addLast (pts[i]);

return this.addXList (list);
}, $fz.isPrivate = true, $fz), "J.script.SV");
$_M(c$, "getPointOrBitsetOperation", 
($fz = function (op, x2) {
switch (x2.tok) {
case 7:
switch (op.intValue) {
case 32:
case 64:
case 96:
case 192:
case 128:
case 160:
return this.addXObj (J.script.ScriptMathProcessor.getMinMax (x2.getList (), op.intValue));
case 1276117010:
case 1141899269:
return this.addXVar (x2.sortOrReverse (op.intValue == 1141899269 ? -2147483648 : 1));
}
var list2 =  new Array (x2.getList ().size ());
for (var i = 0; i < list2.length; i++) {
var v = J.script.SV.unescapePointOrBitsetAsVariable (x2.getList ().get (i));
if (!(Clazz.instanceOf (v, J.script.SV)) || !this.getPointOrBitsetOperation (op, v)) return false;
list2[i] = this.xStack[this.xPt--];
}
return this.addXAV (list2);
case 8:
switch (op.intValue) {
case 1112541185:
case 1112541205:
return this.addXFloat ((x2.value).x);
case 1112541186:
case 1112541206:
return this.addXFloat ((x2.value).y);
case 1112541187:
case 1112541207:
return this.addXFloat ((x2.value).z);
case 1146095626:
var pt = J.util.P3.newP (x2.value);
this.viewer.toCartesian (pt, true);
return this.addXPt (pt);
case 1112541188:
case 1112541189:
case 1112541190:
case 1146095627:
var ptf = J.util.P3.newP (x2.value);
this.viewer.toFractional (ptf, true);
return (op.intValue == 1146095627 ? this.addXPt (ptf) : this.addXFloat (op.intValue == 1112541188 ? ptf.x : op.intValue == 1112541189 ? ptf.y : ptf.z));
case 1112541191:
case 1112541192:
case 1112541193:
case 1146095629:
var ptfu = J.util.P3.newP (x2.value);
this.viewer.toFractional (ptfu, false);
return (op.intValue == 1146095627 ? this.addXPt (ptfu) : this.addXFloat (op.intValue == 1112541191 ? ptfu.x : op.intValue == 1112541192 ? ptfu.y : ptfu.z));
case 1112539151:
case 1112539152:
case 1112539153:
case 1146093582:
var ptu = J.util.P3.newP (x2.value);
this.viewer.toUnitCell (ptu, null);
this.viewer.toFractional (ptu, false);
return (op.intValue == 1146093582 ? this.addXPt (ptu) : this.addXFloat (op.intValue == 1112539151 ? ptu.x : op.intValue == 1112539152 ? ptu.y : ptu.z));
}
break;
case 9:
switch (op.intValue) {
case 1112541185:
case 1112541205:
return this.addXFloat ((x2.value).x);
case 1112541186:
case 1112541206:
return this.addXFloat ((x2.value).y);
case 1112541187:
case 1112541207:
return this.addXFloat ((x2.value).z);
case 1141899280:
return this.addXFloat ((x2.value).w);
}
break;
case 10:
if (op.intValue == 1678770178 && Clazz.instanceOf (x2.value, J.modelset.Bond.BondSet)) return this.addXVar (x2);
var bs = J.script.SV.bsSelectVar (x2);
if (bs.cardinality () == 1 && (op.intValue & 480) == 0) op.intValue |= 32;
var val = this.eval.getBitsetProperty (bs, op.intValue, null, null, x2.value, op.value, false, x2.index, true);
if (op.intValue != 1678770178) return this.addXObj (val);
return this.addXVar (J.script.SV.newVariable (10,  new J.modelset.Bond.BondSet (val, this.viewer.getAtomIndices (bs))));
}
return false;
}, $fz.isPrivate = true, $fz), "J.script.T,J.script.SV");
c$.getMinMax = $_M(c$, "getMinMax", 
($fz = function (floatOrSVArray, tok) {
var data = null;
var sv = null;
var ndata = 0;
while (true) {
if (J.util.Escape.isAF (floatOrSVArray)) {
data = floatOrSVArray;
ndata = data.length;
if (ndata == 0) break;
} else if (Clazz.instanceOf (floatOrSVArray, J.util.JmolList)) {
sv = floatOrSVArray;
ndata = sv.size ();
if (ndata == 0) break;
var sv0 = sv.get (0);
if (sv0.tok == 4 && (sv0.value).startsWith ("{")) {
var pt = J.script.SV.ptValue (sv0);
if (Clazz.instanceOf (pt, J.util.P3)) return J.script.ScriptMathProcessor.getMinMaxPoint (sv, tok);
if (Clazz.instanceOf (pt, J.util.P4)) return J.script.ScriptMathProcessor.getMinMaxQuaternion (sv, tok);
break;
}} else {
break;
}var sum;
switch (tok) {
case 32:
sum = 3.4028235E38;
break;
case 64:
sum = -3.4028235E38;
break;
default:
sum = 0;
}
var sum2 = 0;
var n = 0;
for (var i = ndata; --i >= 0; ) {
var v = (data == null ? J.script.SV.fValue (sv.get (i)) : data[i]);
if (Float.isNaN (v)) continue;
n++;
switch (tok) {
case 160:
case 192:
sum2 += (v) * v;
case 128:
case 96:
sum += v;
break;
case 32:
if (v < sum) sum = v;
break;
case 64:
if (v > sum) sum = v;
break;
}
}
if (n == 0) break;
switch (tok) {
case 96:
sum /= n;
break;
case 192:
if (n == 1) break;
sum = Math.sqrt ((sum2 - sum * sum / n) / (n - 1));
break;
case 32:
case 64:
case 128:
break;
case 160:
sum = sum2;
break;
}
return Float.$valueOf (sum);
}
return "NaN";
}, $fz.isPrivate = true, $fz), "~O,~N");
c$.getMinMaxPoint = $_M(c$, "getMinMaxPoint", 
($fz = function (pointOrSVArray, tok) {
var data = null;
var sv = null;
var ndata = 0;
if (Clazz.instanceOf (pointOrSVArray, Array)) {
data = pointOrSVArray;
ndata = data.length;
} else if (Clazz.instanceOf (pointOrSVArray, J.util.JmolList)) {
sv = pointOrSVArray;
ndata = sv.size ();
}if (sv != null || data != null) {
var result =  new J.util.P3 ();
var fdata =  Clazz.newFloatArray (ndata, 0);
var ok = true;
for (var xyz = 0; xyz < 3 && ok; xyz++) {
for (var i = 0; i < ndata; i++) {
var pt = (data == null ? J.script.SV.ptValue (sv.get (i)) : data[i]);
if (pt == null) {
ok = false;
break;
}switch (xyz) {
case 0:
fdata[i] = pt.x;
break;
case 1:
fdata[i] = pt.y;
break;
case 2:
fdata[i] = pt.z;
break;
}
}
if (!ok) break;
var f = J.script.ScriptMathProcessor.getMinMax (fdata, tok);
if (Clazz.instanceOf (f, Float)) {
var value = (f).floatValue ();
switch (xyz) {
case 0:
result.x = value;
break;
case 1:
result.y = value;
break;
case 2:
result.z = value;
break;
}
} else {
break;
}}
return result;
}return "NaN";
}, $fz.isPrivate = true, $fz), "~O,~N");
c$.getMinMaxQuaternion = $_M(c$, "getMinMaxQuaternion", 
($fz = function (svData, tok) {
var data;
switch (tok) {
case 32:
case 64:
case 128:
case 160:
return "NaN";
}
while (true) {
data = J.script.ScriptMathProcessor.getQuaternionArray (svData, 1073742001);
if (data == null) break;
var retStddev =  Clazz.newFloatArray (1, 0);
var result = J.util.Quaternion.sphereMean (data, retStddev, 0.0001);
switch (tok) {
case 96:
return result;
case 192:
return Float.$valueOf (retStddev[0]);
}
break;
}
return "NaN";
}, $fz.isPrivate = true, $fz), "J.util.JmolList,~N");
c$.getQuaternionArray = $_M(c$, "getQuaternionArray", 
function (quaternionOrSVData, itype) {
var data;
switch (itype) {
case 135270417:
data = quaternionOrSVData;
break;
case 9:
var pts = quaternionOrSVData;
data =  new Array (pts.length);
for (var i = 0; i < pts.length; i++) data[i] = J.util.Quaternion.newP4 (pts[i]);

break;
case 1073742001:
var sv = quaternionOrSVData;
data =  new Array (sv.size ());
for (var i = 0; i < sv.size (); i++) {
var pt = J.script.SV.pt4Value (sv.get (i));
if (pt == null) return null;
data[i] = J.util.Quaternion.newP4 (pt);
}
break;
default:
return null;
}
return data;
}, "~O,~N");
});
// 
//// java\util\regex\Pattern.js 
// 
$_J("java.util.regex");
$_L(null,"java.util.regex.Pattern",["java.lang.IllegalArgumentException","$.StringBuffer","java.util.regex.Matcher"],function(){
c$=$_C(function(){
this.$flags=0;
this.regexp=null;
$_Z(this,arguments);
},java.util.regex,"Pattern",null,java.io.Serializable);
$_M(c$,"matcher",
function(cs){
return new java.util.regex.Matcher(this,cs);
},"CharSequence");
$_M(c$,"split",
function(input,limit){
var res=new Array(0);
var mat=this.matcher(input);
var index=0;
var curPos=0;
if(input.length()==0){
return[""];
}else{
while(mat.find()&&(index+1<limit||limit<=0)){
res[res.length]=input.subSequence(curPos,mat.start()).toString();
curPos=mat.end();
index++;
}
res[res.length]=input.subSequence(curPos,input.length()).toString();
index++;
if(limit==0){
while(--index>=0&&res[index].toString().length==0){
res.length--;
}
}}return res;
},"CharSequence,~N");
$_M(c$,"split",
function(input){
return this.split(input,0);
},"CharSequence");
$_M(c$,"pattern",
function(){
{
return this.regexp.source;
}return null;
});
$_M(c$,"toString",
function(){
return this.pattern();
});
$_M(c$,"flags",
function(){
return this.$flags;
});
c$.compile=$_M(c$,"compile",
function(regex,flags){
if((flags!=0)&&((flags|239)!=239)){
throw new IllegalArgumentException("Illegal flags");
}var flagStr="g";
if((flags&8)!=0){
flagStr+="m";
}if((flags&2)!=0){
flagStr+="i";
}var pattern=new java.util.regex.Pattern();
{
pattern.regexp=new RegExp(regex,flagStr);
}return pattern;
},"~S,~N");
c$.compile=$_M(c$,"compile",
function(pattern){
return java.util.regex.Pattern.compile(pattern,0);
},"~S");
c$.matches=$_M(c$,"matches",
function(regex,input){
return java.util.regex.Pattern.compile(regex).matcher(input).matches();
},"~S,CharSequence");
c$.quote=$_M(c$,"quote",
function(s){
var sb=new StringBuffer().append("\\Q");
var apos=0;
var k;
while((k=s.indexOf("\\E",apos))>=0){
sb.append(s.substring(apos,k+2)).append("\\\\E\\Q");
apos=k+2;
}
return sb.append(s.substring(apos)).append("\\E").toString();
},"~S");
$_K(c$,
($fz=function(){
},$fz.isPrivate=true,$fz));
$_S(c$,
"UNIX_LINES",1,
"CASE_INSENSITIVE",2,
"COMMENTS",4,
"MULTILINE",8,
"LITERAL",16,
"DOTALL",32,
"UNICODE_CASE",64,
"CANON_EQ",128,
"flagsBitMask",239);
});
// 
//// java\util\regex\Matcher.js 
// 
$_J("java.util.regex");
$_L(["java.util.regex.MatchResult"],"java.util.regex.Matcher",["java.lang.IllegalArgumentException","$.IndexOutOfBoundsException","$.NullPointerException","$.StringBuffer"],function(){
c$=$_C(function(){
this.pat=null;
this.string=null;
this.leftBound=-1;
this.rightBound=-1;
this.appendPos=0;
this.replacement=null;
this.processedRepl=null;
this.replacementParts=null;
this.results=null;
$_Z(this,arguments);
},java.util.regex,"Matcher",null,java.util.regex.MatchResult);
$_M(c$,"appendReplacement",
function(sb,replacement){
this.processedRepl=this.processReplacement(replacement);
sb.append(this.string.subSequence(this.appendPos,this.start()));
sb.append(this.processedRepl);
this.appendPos=this.end();
return this;
},"StringBuffer,~S");
$_M(c$,"processReplacement",
($fz=function(replacement){
if(this.replacement!=null&&this.replacement.equals(replacement)){
if(this.replacementParts==null){
return this.processedRepl;
}else{
var sb=new StringBuffer();
for(var i=0;i<this.replacementParts.length;i++){
sb.append(this.replacementParts[i]);
}
return sb.toString();
}}else{
this.replacement=replacement;
var repl=replacement.toCharArray();
var res=new StringBuffer();
this.replacementParts=null;
var index=0;
var replacementPos=0;
var nextBackSlashed=false;
while(index<repl.length){
if((repl[index]).charCodeAt(0)==('\\').charCodeAt(0)&&!nextBackSlashed){
nextBackSlashed=true;
index++;
}if(nextBackSlashed){
res.append(repl[index]);
nextBackSlashed=false;
}else{
if((repl[index]).charCodeAt(0)==('$').charCodeAt(0)){
if(this.replacementParts==null){
this.replacementParts=new Array(0);
}try{
var gr=Integer.parseInt(String.instantialize(repl,++index,1));
if(replacementPos!=res.length()){
this.replacementParts[this.replacementParts.length]=res.subSequence(replacementPos,res.length());
replacementPos=res.length();
}this.replacementParts[this.replacementParts.length]=(($_D("java.util.regex.Matcher$1")?0:java.util.regex.Matcher.$Matcher$1$()),$_N(java.util.regex.Matcher$1,this,null));
var group=this.group(gr);
replacementPos+=group.length;
res.append(group);
}catch(e$$){
if($_O(e$$,IndexOutOfBoundsException)){
var iob=e$$;
{
throw iob;
}
}else if($_O(e$$,Exception)){
var e=e$$;
{
throw new IllegalArgumentException("Illegal regular expression format");
}
}else{
throw e$$;
}
}
}else{
res.append(repl[index]);
}}index++;
}
if(this.replacementParts!=null&&replacementPos!=res.length()){
this.replacementParts[this.replacementParts.length]=res.subSequence(replacementPos,res.length());
}return res.toString();
}},$fz.isPrivate=true,$fz),"~S");
$_M(c$,"reset",
function(newSequence){
if(newSequence==null){
throw new NullPointerException("Empty new sequence!");
}this.string=newSequence;
return this.reset();
},"CharSequence");
$_M(c$,"reset",
function(){
this.leftBound=0;
this.rightBound=this.string.length();
this.appendPos=0;
this.replacement=null;
{
var flags=""+(this.pat.regexp.ignoreCase?"i":"")
+(this.pat.regexp.global?"g":"")
+(this.pat.regexp.multiline?"m":"");
this.pat.regexp=new RegExp(this.pat.regexp.source,flags);
}return this;
});
$_M(c$,"region",
function(leftBound,rightBound){
if(leftBound>rightBound||leftBound<0||rightBound<0||leftBound>this.string.length()||rightBound>this.string.length()){
throw new IndexOutOfBoundsException(leftBound+" is out of bound of "+rightBound);
}this.leftBound=leftBound;
this.rightBound=rightBound;
this.results=null;
this.appendPos=0;
this.replacement=null;
return this;
},"~N,~N");
$_M(c$,"appendTail",
function(sb){
return sb.append(this.string.subSequence(this.appendPos,this.string.length()));
},"StringBuffer");
$_M(c$,"replaceFirst",
function(replacement){
this.reset();
if(this.find()){
var sb=new StringBuffer();
this.appendReplacement(sb,replacement);
return this.appendTail(sb).toString();
}return this.string.toString();
},"~S");
$_M(c$,"replaceAll",
function(replacement){
var sb=new StringBuffer();
this.reset();
while(this.find()){
this.appendReplacement(sb,replacement);
}
return this.appendTail(sb).toString();
},"~S");
$_M(c$,"pattern",
function(){
return this.pat;
});
$_M(c$,"group",
function(groupIndex){
if(this.results==null||groupIndex<0||groupIndex>this.results.length){
return null;
}return this.results[groupIndex];
},"~N");
$_M(c$,"group",
function(){
return this.group(0);
});
$_M(c$,"find",
function(startIndex){
var stringLength=this.string.length();
if(startIndex<0||startIndex>stringLength)throw new IndexOutOfBoundsException("Out of bound "+startIndex);
startIndex=this.findAt(startIndex);
return false;
},"~N");
$_M(c$,"findAt",
($fz=function(startIndex){
return-1;
},$fz.isPrivate=true,$fz),"~N");
$_M(c$,"find",
function(){
{
this.results=this.pat.regexp.exec(this.string.subSequence(this.leftBound,this.rightBound));
}return(this.results!=null);
});
$_M(c$,"start",
function(groupIndex){
var beginningIndex=0;
{
beginningIndex=this.pat.regexp.lastIndex;
}beginningIndex-=this.results[0].length;
return beginningIndex;
},"~N");
$_M(c$,"end",
function(groupIndex){
{
return this.pat.regexp.lastIndex;
}return-1;
},"~N");
$_M(c$,"matches",
function(){
return this.find();
});
c$.quoteReplacement=$_M(c$,"quoteReplacement",
function(string){
if(string.indexOf('\\') < 0 && string.indexOf ('$')<0)return string;
var res=new StringBuffer(string.length*2);
var ch;
var len=string.length;
for(var i=0;i<len;i++){
switch(ch=string.charAt(i)){
case'$':
res.append('\\');
res.append('$');
break;
case'\\':
res.append('\\');
res.append('\\');
break;
default:
res.append(ch);
}
}
return res.toString();
},"~S");
$_M(c$,"lookingAt",
function(){
return false;
});
$_M(c$,"start",
function(){
return this.start(0);
});
$_V(c$,"groupCount",
function(){
return this.results==null?0:this.results.length;
});
$_M(c$,"end",
function(){
return this.end(0);
});
$_M(c$,"toMatchResult",
function(){
return this;
});
$_M(c$,"useAnchoringBounds",
function(value){
return this;
},"~B");
$_M(c$,"hasAnchoringBounds",
function(){
return false;
});
$_M(c$,"useTransparentBounds",
function(value){
return this;
},"~B");
$_M(c$,"hasTransparentBounds",
function(){
return false;
});
$_M(c$,"regionStart",
function(){
return this.leftBound;
});
$_M(c$,"regionEnd",
function(){
return this.rightBound;
});
$_M(c$,"requireEnd",
function(){
return false;
});
$_M(c$,"hitEnd",
function(){
return false;
});
$_M(c$,"usePattern",
function(pat){
if(pat==null){
throw new IllegalArgumentException("Empty pattern!");
}this.pat=pat;
this.results=null;
return this;
},"java.util.regex.Pattern");
$_K(c$,
function(pat,cs){
this.pat=pat;
this.string=cs;
this.leftBound=0;
this.rightBound=this.string.toString().length;
},"java.util.regex.Pattern,CharSequence");
c$.$Matcher$1$=function(){
$_H();
c$=$_C(function(){
$_B(this,arguments);
this.grN=0;
$_Z(this,arguments);
},java.util.regex,"Matcher$1");
$_Y(c$,function(){
this.grN=gr;
});
$_V(c$,"toString",
function(){
return this.b$["java.util.regex.Matcher"].group(this.grN);
});
c$=$_P();
};
$_S(c$,
"MODE_FIND",1,
"MODE_MATCH",2);
});
// 
//// java\util\regex\MatchResult.js 
// 
$_J("java.util.regex");
$_I(java.util.regex,"MatchResult");
