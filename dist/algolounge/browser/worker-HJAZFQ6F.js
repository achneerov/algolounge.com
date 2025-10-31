var h=null,f=null,o=null;function v(t){if(!t.includes("Traceback")&&!t.includes("File"))return t;let e=t.split(`
`).filter(c=>c.trim()),a=e[e.length-1]||t,l=null;for(let c of e){let r=c.match(/File.*<exec>.*line (\d+)/);if(r){l=parseInt(r[1]);break}}let u=a.trim();return u=u.replace(/^(Error:|Exception:)\s*/,""),l?`Line ${l}: ${u}`:u}async function x(){return h||f||(f=(async()=>{try{let e=await(await import("https://cdn.jsdelivr.net/pyodide/v0.28.0/full/pyodide.mjs")).loadPyodide({indexURL:"https://cdn.jsdelivr.net/pyodide/v0.28.0/full/"});return typeof SharedArrayBuffer<"u"&&(o=new Int32Array(new SharedArrayBuffer(4)),e.setInterruptBuffer(o)),e}catch(t){throw f=null,new Error(`Failed to load Pyodide: ${t instanceof Error?t.message:String(t)}`)}})(),h=await f,h)}async function C(t,e,a,l,u){let c=performance.now(),r=await x(),i=[],E=[];try{r.runPython(t),r.runPython(l),r.runPython(u);for(let s=0;s<e.length;s++){let n=e[s],_=[];try{r.runPython(`
import sys
from io import StringIO
test_output = StringIO()
sys.stdout = test_output
        `);let p,d,m="",I=JSON.stringify(n.input).replace(/null/g,"None"),O=n.input.operations?`
_test_input = prepare(${I})
operations, values = _test_input
_obj = ${a}()
_test_result = []
for op, val in zip(operations, values):
    if op == '${a}':
        _test_result.append(None)
    else:
        method = getattr(_obj, op)
        result = method(*val) if val else method()
        _test_result.append(result)
_test_result
        `:`
_test_input = prepare(${I})
_test_result = ${a}(*_test_input)
_test_result
        `,y=r.runPython(O);p=y&&typeof y.toJs=="function"?y.toJs():y;let b=JSON.stringify(n.output).replace(/null/g,"None"),g=r.runPython(`verify(_test_result, ${b})`),P=g&&typeof g.toJs=="function"?g.toJs():g;d=P[0],m=P[1]||"";let M=r.runPython("test_output.getvalue()");M&&_.push(...M.split(`
`).filter(B=>B.trim())),i.push({id:n.id,input:n.input,expectedOutput:n.output,actualOutput:m||p,passed:d,output:_})}catch(p){let d=p instanceof Error?p.message:String(p);i.push({id:n.id,input:n.input,expectedOutput:n.output,actualOutput:null,passed:!1,error:v(d),output:_})}finally{r.runPython("sys.stdout = sys.__stdout__")}}}catch(s){let n=s instanceof Error?s.message:String(s);i.push({id:1,input:{},expectedOutput:null,actualOutput:null,passed:!1,error:v(n),output:[]})}let S=performance.now(),w=i.filter(s=>s.passed).length;return{testResults:i,executionTime:Math.round(S-c),passedCount:w,totalCount:i.length,output:E}}addEventListener("message",async({data:t})=>{try{if(t.type==="init")await x(),postMessage({type:"ready"});else if(t.type==="getInterruptBuffer")o&&postMessage({type:"interruptBuffer",buffer:o},[o.buffer]);else if(t.type==="interrupt")o&&Atomics.store(o,0,2);else if(t.type==="execute"){o&&Atomics.store(o,0,0);let e=await C(t.code,t.testCases,t.functionName,t.prepareCode,t.verifyCode);postMessage({type:"result",result:e})}}catch(e){postMessage({type:"error",error:e instanceof Error?e.message:String(e)})}});
