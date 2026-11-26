import json
import tempfile
import unittest
from pathlib import Path
from chingu.core import Store, run_one, validate_tool, MAX_STEPS

class CoreTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.store=Store(str(Path(self.tmp.name)/"test.sqlite3"))
    def model(self,*actions):
        iterator=iter(actions)
        return lambda messages:json.dumps(next(iterator))
    def submit(self): return self.store.submit("personal","Test task")
    def test_final(self):
        i=self.submit()
        self.assertTrue(run_one(self.store,self.model({"type":"final","text":"done"})))
        self.assertEqual(self.store.get(i)["result"],"done")
    def test_tool_and_result(self):
        i=self.submit()
        def model(messages):
            if len(messages)==2:return json.dumps({"type":"tool","name":"calculate","args":{"op":"mul","a":2,"b":3}})
            self.assertIn("6",messages[-1]["content"])
            return json.dumps({"type":"final","text":"6"})
        run_one(self.store,model)
        self.assertEqual(self.store.get(i)["status"],"completed")
    def test_approval(self):
        i=self.submit()
        run_one(self.store,self.model({"type":"tool","name":"note_write","args":{"text":"hello"}}))
        self.assertEqual(self.store.get(i)["status"],"approval")
        self.assertEqual(self.store.notes(),[])
        self.store.approve(i,True)
        self.assertEqual(self.store.notes()[0]["text"],"hello")
        with self.assertRaises(ValueError):self.store.approve(i,True)
        run_one(self.store,self.model({"type":"final","text":"saved"}))
        self.assertEqual(self.store.get(i)["status"],"completed")
    def test_reject(self):
        i=self.submit()
        run_one(self.store,self.model({"type":"tool","name":"note_write","args":{"text":"no"}}))
        self.store.approve(i,False)
        self.assertEqual(self.store.notes(),[])
    def test_unknown_tool(self):
        i=self.submit()
        run_one(self.store,self.model({"type":"tool","name":"shell","args":{}}))
        self.assertEqual(self.store.get(i)["status"],"failed")
    def test_step_limit(self):
        i=self.submit()
        run_one(self.store,lambda _:json.dumps({"type":"tool","name":"clock","args":{}}))
        self.assertEqual(self.store.get(i)["steps"],MAX_STEPS)
        self.assertEqual(self.store.get(i)["status"],"failed")
    def test_bad_inputs(self):
        with self.assertRaises(ValueError):self.store.submit("fake","test")
        with self.assertRaises(ValueError):validate_tool("calculate",{"op":"add","a":True,"b":1})
    def test_recovery(self):
        i=self.submit()
        self.store.claim()
        self.store.recover()
        self.assertEqual(self.store.get(i)["status"],"failed")
