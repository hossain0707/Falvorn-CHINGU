const test=require("node:test"),assert=require("node:assert/strict"),{createHandler}=require("./api/inference.js");
const env={GROQ_API_KEY:"fake-test-key",CHINGU_DEMO_CODE:"test-code-123456789",CHINGU_AI_ENABLED:"true"},body={agent:1,prompt:"Draft a plan",access:env.CHINGU_DEMO_CODE};
async function call(h,input,method="POST"){let status,result;const res={setHeader(){},status(n){status=n;return this},json(v){result=v;return this}};await h({method,headers:{"content-type":"application/json"},body:input},res);return {status,result};}
const never=()=>{throw Error("unexpected provider call")};
test("disabled without config",async()=>{assert.equal((await call(createHandler({},never),body)).status,503)});
test("invalid invite denied",async()=>{assert.equal((await call(createHandler(env,never),{...body,access:"bad"})).status,401)});
test("input bounded",async()=>{assert.equal((await call(createHandler(env,never),{...body,prompt:"x".repeat(4001)})).status,400)});
test("valid request",async()=>{const mock=async(url,options)=>{assert.equal(url,"https://api.groq.com/openai/v1/chat/completions");assert.equal(JSON.parse(options.body).model,"openai/gpt-oss-20b");return {ok:true,json:async()=>({choices:[{message:{content:"Test answer"}}]})};};assert.equal((await call(createHandler(env,mock),body)).result.text,"Test answer")});
test("quota stops without fallback",async()=>{let n=0;const mock=async()=>{n++;return {ok:false,status:429}};assert.equal((await call(createHandler(env,mock),body)).status,429);assert.equal(n,1)});
