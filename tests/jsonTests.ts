import ps= require("./actualParse")
import ts = require("../src/typesystem")
import chai = require("chai");
const assert = chai.assert;

describe("JSON Schemas testing",function() {
    it("schema with reference, example is valid", function () {
        var tp = ps.parseJSON("SomeType", {
            type: '{"$schema":"http://json-schema.org/draft-04/schema","type":"object","properties":{"parentName":{"type":"string"},"child":{"$ref":"./content/jsonschemetest/test1/scheme.json#"}}}'
        });

        assert.isTrue(tp.validate({parentName:"someName",child:{childName:"anotherName"}}).isOk());
    });
    it("schema with reference, example is invalid", function () {
        var tp = ps.parseJSON("SomeType", {
            type: '{"$schema":"http://json-schema.org/draft-04/schema","type":"object","properties":{"parentName":{"type":"string"},"child":{"$ref":"./content/jsonschemetest/test1/scheme.json#"}}}'
        });

        assert.isTrue(!tp.validate({parentName:"someName",child:{childName1:"anotherName"}}).isOk());
    });
})

describe("Simple validation testing",function() {
    it("built in types exist", function () {
        var tp=ps.parseJSON("Person",{
            type: "string[]"
        })
        assert.isTrue(tp.isSubTypeOf(ts.ARRAY));
    });
    it("min length", function () {
        var tp=ps.parseJSON("Person",{
            type: "string",
            minLength: 4
        })
        assert.isTrue(!tp.validate("123").isOk());
        assert.isTrue(tp.validate("1234").isOk());
    });
    it("max length", function () {
        var tp=ps.parseJSON("Person",{
            type: "string",
            maxLength: 4
        })
        assert.isTrue(!tp.validate("12345").isOk());
        assert.isTrue(tp.validate("1234").isOk());
    });
    it("min items", function () {
        var tp=ps.parseJSON("Person",{
            type: "string[]",
            minItems: 1
        })
        assert.isTrue(!tp.validate([]).isOk());
        assert.isTrue(tp.validate(["1234"]).isOk());
    });
    it("max items", function () {
        var tp=ps.parseJSON("Person",{
            type: "string[]",
            maxItems: 0
        })
        assert.isTrue(tp.validate([]).isOk());
        assert.isTrue(!tp.validate(["1234"]).isOk());
    });
    it("min properties", function () {
        var tp=ps.parseJSON("Person",{
            type: "object",
            minProperties: 1
        })
        assert.isTrue(!tp.validate({}).isOk());
        assert.isTrue(tp.validate({d:2,e:3}).isOk());
    });
    it("max properties", function () {
        var tp=ps.parseJSON("Person",{
            type: "object",
            maxProperties: 1
        })
        assert.isTrue(tp.validate({}).isOk());
        assert.isTrue(tp.validate({d:2}).isOk());
    });
    it("min properties", function () {
        var tp=ps.parseJSON("Person",{
            type: "object",
            minProperties: 1
        })
        assert.isTrue(!tp.validate({}).isOk());
        assert.isTrue(tp.validate({d:2,e:3}).isOk());
    });
    it("minimum", function () {
        var tp=ps.parseJSON("Person",{
            type: "number",
            minimum: 1
        })
        assert.isTrue(tp.validate(1).isOk());
        assert.isTrue(!tp.validate(0).isOk());
    });
    it("maximum", function () {
        var tp=ps.parseJSON("Person",{
            type: "number",
            maximum: 2
        })
        assert.isTrue(tp.validate(1).isOk());
        assert.isTrue(!tp.validate(3).isOk());
    });
    it("pattern", function () {
        var tp=ps.parseJSON("Person",{
            type: "string",
            pattern: "^.$"
        })
        assert.isTrue(tp.validate("d").isOk());
        assert.isTrue(!tp.validate("dd").isOk());
    });
    it("enum", function () {
        var tp=ps.parseJSON("Person",{
            type: "string",
            enum: ["a","b"]
        })
        assert.isTrue(tp.validate("a").isOk());
        assert.isTrue(!tp.validate("dd").isOk());
    });
    it("hasProperty", function () {
        var tp=ps.parseJSON("Person",{
            type: "object",
            properties:{
                a: "any"
            }
        })
        assert.isTrue(!tp.validate("a").isOk());
        assert.isTrue(tp.validate({a:"dd"}).isOk());
    });
    it("known properties", function () {
        var tp=ps.parseJSON("Person",{
            type: "object",
            properties:{
                a: "any"
            }
        })
        assert.isTrue(!tp.validate("a").isOk());
        assert.isTrue(!tp.validate({a2:"dd"}).isOk());
    });
    it("additional properties", function () {
        var tp=ps.parseJSON("Person",{
            type: "object",
            properties:{
                a: "any",
                "/.*/": "any"
            }
        })
        var st=tp.validate({a: 3,a2:"dd"});
        assert.isTrue(st.isOk());
    });
    it("property should be of type", function () {
        var tp=ps.parseJSON("Person",{
            type: "object",
            properties:{
                a: "string",
                "/.*/": "any"
            }
        })
        var st=tp.validate({a: 3,a2:"dd"});
        assert.isTrue(!st.isOk());
        var st=tp.validate({a: "3",a2:"dd"});
        assert.isTrue(st.isOk());
    });
    it("additional property should be of type", function () {
        var tp=ps.parseJSON("Person",{
            type: "object",
            properties:{
                a: "string",
                "/.*/": "string"
            }
        })
        var st=tp.validate({a: "3",a2:4});
        assert.isTrue(!st.isOk());
        var st=tp.validate({a: "3",a2:"dd"});
        assert.isTrue(st.isOk());
    });
    it("pattern property should be of type", function () {
        var tp=ps.parseJSON("Person",{
            type: "object",
            properties:{
                a: "string",
                "/../": "string"
            }
        })
        var st=tp.validate({a: "3",a2:4});
        assert.isTrue(!st.isOk());
        var st=tp.validate({a: "3",a2:"dd"});
        assert.isTrue(st.isOk());
    });
    it("pattern property has higher priotity", function () {
        var tp=ps.parseJSON("Person",{
            type: "object",
            properties:{
                "/.*/": "number",
                "/../": "string"
            }
        })
        var st=tp.validate({a: "3",a2:4});
        assert.isTrue(!st.isOk());
        var st=tp.validate({a: 3,a2:"dd"});
        assert.isTrue(st.isOk());
    });
    it("unique items", function () {
        var tp=ps.parseJSON("Person",{
            type: "number[]",
            uniqueItems: true
        })
        var st=tp.validate([2,2]);
        assert.isTrue(!st.isOk());
        var st=tp.validate([2,3]);
        assert.isTrue(st.isOk());
    });
    it ("inplace definition",function(){
        var tp=ps.parseJSON("Person",{
            type: "object",
            properties:{
                a: {
                    type:"string",
                    minLength: 3,
                    maxLength: 5
                },

            }
        })
        assert.isTrue(tp.validate({a:"dddd"}).isOk());
        assert.isTrue(!tp.validate({a:"dd"}).isOk());
        assert.isTrue(!tp.validate({a:"ddddddd"}).isOk());
    })
})
describe("Type to JSON tests",function() {
    it("serialized simple type is same as original", function () {
        var st={
            type: "string[]"
        };
        var tp=ps.parseJSON("Person",st);
        assert.deepEqual(st,ps.storeAsJSON(tp));
    });
    it("basic facets", function () {
        var st={
            type: "string[]",
            minItems: 2
        };
        var tp=ps.parseJSON("Person",st);
        assert.deepEqual(st,ps.storeAsJSON(tp));
    });
    it("annotations", function () {
        var st={
            type: "string[]",
            "(minItems)": 2
        };
        var tp=ps.parseJSON("Person",st);
        assert.deepEqual(st,ps.storeAsJSON(tp));
    });
    it("basic facets+wrong type", function () {
        var st={
            type: "string[]",
            "minItems": "2"
        };
        var tp=ps.parseJSON("Person",st);
        assert.deepEqual(st,ps.storeAsJSON(tp));
    });
    it("facet declarations", function () {
        var st={
            type: "string[]",
            "facets": {
                long: "string"
            }
        };
        var tp=ps.parseJSON("Person",st);
        assert.deepEqual(st,ps.storeAsJSON(tp));
    });
    it("facet declarations 2", function () {
        var st={
            type: "string[]",
            "facets": {
                "long?": "string"
            }
        };
        var tp=ps.parseJSON("Person",st);
        assert.deepEqual(st,ps.storeAsJSON(tp));
    });
    it("facet declarations 3", function () {
        var st={
            type: "string[]",
            "facets": {
                "long?": {
                    type: "string | boolean",
                    "(xx)": true
                }
            }
        };
        var tp=ps.parseJSON("Person",st);
        assert.deepEqual(st,ps.storeAsJSON(tp));
    });
    it("facet declarations 3", function () {
        var st={
            type: "string[]",
            "facets": {
                "long?": {
                    type: "string | boolean",
                    "xml":
                    {
                        wrapped: true,
                        name: "hello"
                    }
                }
            }
        };
        var tp=ps.parseJSON("Person",st);
        assert.deepEqual(st,ps.storeAsJSON(tp));
    });
    it("properties", function () {
        var st={
            type: "object",
            "properties": {
                "long?": {
                    type: "string | boolean",
                    "xml":
                    {
                        wrapped: true,
                        name: "hello"
                    }
                }
            }
        };
        var tp=ps.parseJSON("Person",st);
        assert.deepEqual(st,ps.storeAsJSON(tp));
    });
    it("properties2", function () {
        var st={
            type: "object",
            "properties": {
                "long": "string",
                "/.*/": "scalar"
            }
        };
        var tp=ps.parseJSON("Person",st);
        assert.deepEqual(st,ps.storeAsJSON(tp));
    });

    it("properties3", function () {
        var st={
            type: "object",
            "properties": {
                "long": "string",
                "/xx/": "scalar"
            }
        };
        var tp=ps.parseJSON("Person",st);
        assert.deepEqual(st,ps.storeAsJSON(tp));
    });
    it("invalid pattern properties 1", function () {
        var st={
            type: "object",
            "properties": {
                "[]": "string"
            }
        };
        var tp=ps.parseJSON("Person",st);
        var result = tp.validate({ "prop": "value" });
        assert(!result.isOk());
        var errors = result.getErrors();
        assert(errors.length==1);
        assert(errors[0].message=="Required property '[]' is missing");
    });

    it("invalid pattern properties 2", function () {
        var st={
            type: "object",
            "properties": {
                "objectProperty": {
                    "type": "object",
                    "properties": {
                        "[]": "string"
                    }
                }
            }            
        };
        var tp=ps.parseJSON("Person",st);
        var result = tp.validate({
            "objectProperty": {
                "prop": "value"
            }
        });
        assert(!result.isOk());
        var errors = result.getErrors();
        assert(errors.length==1);
        assert(errors[0].message=="Required property '[]' is missing");
    });
    it("simple", function () {
        var st="string";
        var tp=ps.parseJSON("Person",st);
        assert.deepEqual(st,ps.storeAsJSON(tp));
    });
    it("simple 2", function () {
        var st="string[]";
        var tp=ps.parseJSON("Person",st);
        assert.deepEqual(st,ps.storeAsJSON(tp));
    });
})
describe("Type collection parse and store",function(){
    it ("simple collection",function(){
        var st={
            types:{
                Person:
                {
                    type: "object",
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    type: "Person",
                    properties:{
                        rank: "string"
                    },
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var general=col.getType("General");
        assert.isTrue(general.validate({name: "P", rank:"Officer"}).isOk());
    });
    it ("simple collection 1",function(){
        var st={
            types:{
                Person:
                {
                    type: "object",
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    type: "Person",
                    properties:{
                        rank: "string",
                        team: "Person[]"
                    },
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var general=col.getType("General");
        assert.isTrue(general.validate({name: "P", rank:"Officer",team:[{ name:"P2"}]}).isOk());
    });
    it ("simple collection 2",function(){
        var st={
            types:{
                Person:
                {
                    type: "object",
                    closed: true,
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    type: "Person",
                    closed: true,
                    properties:{
                        rank: "string",
                        team: "Person[]"
                    },
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var general=col.getType("General");
        assert.isTrue(!general.validate({name: "P", rank:"Officer",team:[{ name:"P2",q:2}]}).isOk());
    });
    it ("simple collection 3",function(){
        var st={
            types:{
                Person:
                {
                    type: "object",
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    type: "Person",
                    properties:{
                        rank: "string",
                        team: "General[]"
                    },
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var general=col.getType("General");
        assert.isTrue(!general.validate({name: "P", rank:"Officer",team:[{ name:"P2",q:2}]}).isOk());
    });
    it ("simple collection 4",function(){
        var st={
            types:{
                Person:
                {
                    type: "object",
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    type: "Person",
                    properties:{
                        rank: "string",
                        team: "General[]"
                    },
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var general=col.getType("General");
        var instanceStatus=general.validate({name: "P", rank:"Officer",team:[{ name:"P2",rank:"Officer",team:[]}]});
        assert.isTrue(instanceStatus.isOk());
    });
    it ("simple collection 5",function(){
        var st={
            types:{
                Person:
                {
                    type: "object",
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    type: "Person",
                    properties:{
                        rank: "string",
                        team: "Person[]"
                    },
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var general=col.getType("Person");
        var instanceStatus=general.validate({name: "P", rank:"Officer",team:[{ name:"P2",rank:"Officer",team:[]}]});
        assert.isTrue(instanceStatus.isOk());
    });
    it ("simple collection 51",function(){
        var st={
            types:{
                Person:
                {
                    type: "object",
                    closed: true,
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    type: "Person",
                    properties:{
                        rank: "string",
                        team: "Person[]"
                    },
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var general=col.getType("Person");
        var instanceStatus=general.validate({name: "P", rank:"Officer",team:[{ name:"P2",rank:"Officer",team:[],q:2}]});
        assert.isTrue(!instanceStatus.isOk());
    });
    it ("simple collection 6",function(){
        var st={
            types:{
                Person:
                {
                    type: "object",
                    closed: true,
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    type: "Person",
                    properties:{
                        rank: "string",
                        team: "Person[]"
                    },
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var general=col.getType("General");
        var instanceStatus=general.validate({name: "P", rank:"Officer",team:[{ name:"P2",rank:"Officer",team:[],q:2}]});
        assert.isTrue(!instanceStatus.isOk());
    });
    it ("simple collection 7",function(){
        var st={
            types:{
                Person:
                {
                    type: "object",
                    closed: true,
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    type: "Person",
                    closed: true,
                    properties:{
                        rank: "string",
                        team: "(Person| General)[]"
                    },
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var general=col.getType("General");
        var instanceStatus=general.validate({name: "P", rank:"Officer",team:[{ name:"P2",rank:"Officer",team:[],q:2}]});
        assert.isTrue(!instanceStatus.isOk());
    });
    it ("simple collection 8",function(){
        var st={
            types:{
                Person:
                {
                    type: "object",
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    type: "Person",
                    properties:{
                        rank: "string",
                        team: "(Person| General)[]"
                    },
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var general=col.getType("General");
        var instanceStatus=general.validate({name: "P", rank:"Officer",team:[{ name:"P2",rank:"Officer",team:[]}]});
        assert.isTrue(instanceStatus.isOk());
    });
    it ("simple collection 9",function(){
        var st={
            types:{
                Person:
                {
                    type: "object",
                    closed: true,
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    type: "Person",
                    properties:{
                        rank: "string",
                        team: "(Person| General)[]"
                    },
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var general=col.getType("General");
        var instanceStatus=general.validate({name: "P", rank:"Officer",team:[{ name:"P2",rank:"Officer"}]});
        assert.isTrue(!instanceStatus.isOk());
    });
    it ("simple collection 91",function(){
        var st={
            types:{
                Person:
                {
                    type: "General",
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    type: "Person",
                    properties:{
                        rank: "string",
                        team: "(Person| General)[]"
                    },
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var general=col.getType("General");
        var instanceStatus=general.validate({name: "P", rank:"Officer",team:[{ name:"P2",rank:"Officer"}]});
        assert.isTrue(!instanceStatus.isOk());
    });
    it ("simple collection 10",function(){
        var st={
            types:{
                Person:
                {
                    type: "Person",
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    type: "Person | General",
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var general=col.getType("General");
        var instanceStatus=general.validate({name: "P", rank:"Officer",team:[{ name:"P2",rank:"Officer"}]});
        assert.isTrue(!instanceStatus.isOk());
    });
    it ("store type collecion",function(){
        var st={
            types:{
                Person:
                {
                    type: "Person",
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    type: "Person | General",
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var q=ps.storeAsJSON(col);
        assert.deepEqual(q,st);
    });
    it ("store type collection 2",function(){
        var st={
            types:{
                Person:
                {
                    type: "Person",
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    properties: {
                        title: "string"
                    },
                    type: "Person | General",
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var q=ps.storeAsJSON(col);
        assert.deepEqual(q,st);
    });
    it ("store type collection 3",function(){
        var st={
            annotationTypes:
            {
                owner: "Person"
            },
            types:{
                Person:
                {
                    type: "object",
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false
                },
                General:
                {
                    properties: {
                        title: "string"
                    },
                    type: "Person | General",
                    additionalProperties: false
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var q=ps.storeAsJSON(col);
        assert.deepEqual(q,st);
    });
    it ("store type collection 4",function(){
        var st={
            annotationTypes:
            {
                owner: "Person"
            },
            types:{
                Person:
                {
                    type: "object",
                    properties: {
                        name: "string"
                    },
                    additionalProperties: false,
                    examples:{
                        a: {
                            content:{
                                name: "A1"
                            }
                        },
                        b: {
                            content:{
                                name: "A1"
                            }
                        }
                    }
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var q=ps.storeAsJSON(col);
        assert.deepEqual(q,st);
    });
    it ("parse type collection issue0",function(){
        var st={
            annotationTypes:
            {
                owner: "Person"
            },
            types:{
                t1:"object",
                t2:"object",
                t3:["t1","t2"]
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var q=ps.storeAsJSON(col);
        assert.deepEqual(q,st);
    });
    it ("parse type collection issue1",function(){
        var st={
            annotationTypes:
            {
                owner: "Person"
            },
            types:{
                t1:{
                    type:"object",
                    additionalProperties: {
                        "/.+/": "number"
                    }
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var q=ps.storeAsJSON(col);

        var t1=col.getType("t1");
        var instanceStatus=t1.validateType();
        assert.isTrue(!instanceStatus.isOk());
        assert.isTrue(instanceStatus.message.indexOf('additionalProperties') != -1);
        //assert.deepEqual(q,st);
    });
    it ("parse type collection issue2",function(){
        var st={
            annotationTypes:
            {
                owner: "Person"
            },
            types:{
                t1:{
                    type:"object",
                    patternProperties: { x:"number"}
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var q=ps.storeAsJSON(col);
        //assert.deepEqual(q,st);
    });
    it ("parse type collection issue3",function(){
        var st={
            annotationTypes:
            {
                owner: "Person"
            },
            types:{
                t1:{
                    type:"object2",
                    patternProperties: { x:"number"}
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var q=ps.storeAsJSON(col);
        //assert.deepEqual(q,st);
    });
    it ("parse uses ",function(){
        var st={
            annotationTypes:
            {
                owner: "Person"
            },
            uses:{
              D:{
                  types:{
                      Hello:{
                          type: "object"
                      }
                  }
              }
            },
            types:{
                t1:{
                    type:"D.Hello",

                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t1= col.getType("t1");
        assert.isTrue(t1.isObject());
        //assert.deepEqual(q,st);
    });
    it ("parse uses iplace",function(){
        var st={
            annotationTypes:
            {
                owner: "Person"
            },
            uses:{
                D:{
                    types:{
                        Hello:{
                            type: "object"
                        }
                    }
                }
            },
            types:{
                t1:"D.Hello"
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t1= col.getType("t1");
        assert.isTrue(t1.isObject());
        //assert.deepEqual(q,st);
    });
    it ("parse uses 2",function(){
        var st={

            uses:{
                D:{
                    types:{
                        Hello:{
                            type: "object"
                        }
                    }
                }
            },
            annotationTypes:{
                t1:{
                    type:"D.Hello",

                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t1= col.getAnnotationType("t1");
        assert.isTrue(t1.isObject());
    });
    it ("inplace types",function(){
        var st={


            annotationTypes:{
                t1:{
                    type:"object",
                    properties: {
                        name: {
                            type: "string",
                            minLength: 5
                        }
                    }

                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var q=ps.storeAsJSON(col);
        assert.deepEqual(q,st);
    });
    // it ("map types",function(){
    //     var st={
    //
    //
    //         types:{
    //             t1:{
    //                 type:"object",
    //                 properties: {
    //                     numberMap: "number{}"
    //                 }
    //
    //             }
    //         }
    //     };
    //     var col=ps.parseJSONTypeCollection(st);
    //     var t=col.getType("t1");
    //     assert.isTrue(t.validateType(ts.builtInRegistry()).isOk());
    //     assert.isTrue(t.validate({ "numberMap":{a:2}}).isOk());
    //     assert.isTrue(!t.validate({ "numberMap":{a:"ss"}}).isOk());
    // });
    
    it ("external type",function(){
        var st={


            types:{
                t1:{
                    type:"{ type: object2 }",

                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(!val);

    });
    it ("enum validation",function(){
        var st={


            types:{
                t1:{
                    type:"number",
                    enum:["a"]

                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(!val);

    });
    it ("enum validation 2",function(){
        var st={


            types:{
                t1:{
                    type:"number",
                    enum:[0,1,2]

                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);

    });
    it ("enum validation 3",function(){
        var st={


            types:{
                t1:{
                    type:"number",
                    enum:[0,1,2,"a"]

                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(!val);

    });
    it ("builtin facets",function(){
        var st={


            types:{
                t1:{
                    type:"number",
                    facets:{ properties:"string"}

                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(!val);

    });
    it ("schema and type can not be used together",function(){
        var st={


            types:{
                t1:{
                    type:"number",
                    schema: "integer"

                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(!val);

    });
    it ("pattern properties test 1",function(){
        var st={


            types:{
                t1:{
                    type:"object",
                    properties:{
                        x: "number",
                        "/x/":"string"
                    },
                    "example": {
                        "x" : 123
                    }
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);

    });
    it ("pattern properties test 2",function(){
        var st={


            types:{
                t1:{
                    type:"object",
                    properties:{
                        x: "number",
                        "/x/":"string"
                    },
                    "example": {
                        "x" : "abc"
                    }
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(!val);

    });
    it ("one more pattern properties test",function(){
        var st={


            types:{
                t1:{
                    type:"object",
                    properties:{
                        x: "number",
                        "/x2/":"string"
                    }
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);

    });
    it ("no external types in properties ",function(){
        var st={


            types:{
                t0:"{}",
                t1:{
                    type:"object",
                    properties:{
                        x: "t0"
                    }
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(!val);

    });
    it ("no external types in components",function(){
        var st={


            types:{
                t0:"{}",
                t1:{
                    type:"object",
                    properties:{
                        x: "t0[]"
                    }
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(!val);

    });
    it ("it is illegal to do semantic inheritance from external types",function(){
        var st={


            types:{
                t0:"{}",
                t1:{
                    type:[ "object","t0"],
                    properties:{
                        x: "number"
                    }
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(!val);
    });
    it ("one more pattern properties test (new style)",function(){
        var st={


            types:{
                t1:{
                    type:"object",
                    properties:{
                        x: "number",
                        "/x2/":"string"
                    }
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);

    });
    it ("extending from object and union",function(){
        var st={


            types:{
                t1:{
                    type:"object",
                    properties:{
                        x: "number",

                    }
                },
                t2:{
                    type:"object",
                    properties:{
                        y: "number",

                    }
                },
                t3:{
                    type:"object",
                    properties:{
                        z: "number",

                    }
                },
                t4:{
                    type: ["t1","t2|t3"],
                    example:{
                        x: 1,
                        y: 2
                    }
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t4");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);

    });
    it ("extending from object and union (negative)",function(){
        var st={


            types:{
                t1:{
                    type:"object",
                    properties:{
                        x: "number",

                    }
                },
                t2:{
                    type:"object",
                    properties:{
                        y: "number",

                    }
                },
                t3:{
                    type:"object",
                    properties:{
                        z: "number",

                    }
                },
                t4:{
                    type: ["t1","t2|t3"],
                    example:{
                        x: 1,
                        y2: 2
                    }
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t4");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(!val);

    });
    it ("extending from object and union types allows to use object facets",function(){
        var st={


            types:{
                t1:{
                    type:"object",
                    properties:{
                        x: "number",

                    }
                },
                t2:{
                    type:"object",
                    properties:{
                        y: "number",

                    }
                },
                t3:{
                    type:"object",
                    properties:{
                        z: "number",

                    }
                },
                t4:{
                    type: ["t1","t2|t3"],
                    properties:{
                        y2: "number"
                    },
                    example:{
                        x: 1,
                        y2: 2,
                        y: 3
                    }
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t4");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);

    });
    it ("extending from object union type allows to use object facets",function(){
        var st={


            types:{
                t1:{
                    type:"object",
                    properties:{
                        x: "number",

                    }
                },
                t2:{
                    type:"object",
                    properties:{
                        y: "number",

                    }
                },
                t3:{
                    type:"object",
                    properties:{
                        z: "number",

                    }
                },
                t4:{
                    type: ["t2|t3"],
                    properties:{
                        y2: "number"
                    },
                    example:{
                        y2: 2,
                        y: 3
                    }
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t4");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);
    });
    it ("discriminator is only allowed for top levels",function(){
        var st={


            types:{
                t1:{
                    type:"object",
                    properties:{
                        x: {
                            type: "object",
                            properties:{
                                xx:"string"
                            },
                            discriminator: "xx"
                        }

                    }
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(!val);
    });
    it ("date only positive",function(){
        var st={


            types:{
                t1:{
                    type:"date-only",
                    example: "1992-12-02"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);
    });
    it ("date only positive 2",function(){
        var st={


            types:{
                t1:{
                    type:"date-only",
                    example: "0001-01-01"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);
    });
    it ("date only positive 3",function(){
        var st={


            types:{
                t1:{
                    type:"date-only",
                    example: "0099-01-01"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);
    });
    it ("date only positive 4",function(){
        var st={


            types:{
                t1:{
                    type:"date-only",
                    example: "0100-01-01"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);
    });
    it ("date only positive 5",function(){
        var st={


            types:{
                t1:{
                    type:"date-only",
                    example: "0069-01-01"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);
    });
    it ("date only positive 6",function(){
        var st={


            types:{
                t1:{
                    type:"date-only",
                    example: "0070-01-01"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);
    });
    it ("date only negative 1",function(){
        var st={


            types:{
                t1:{
                    type:"date-only",
                    example: "19d92-12-02s"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(!val);
    });
    it ("date only negative 2",function(){
        var st={


            types:{
                t1:{
                    type:"date-only",
                    example: "1999-12-31T21:00:00"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(!val);
    });
    it ("time only positive",function(){
        var st={


            types:{
                t1:{
                    type:"time-only",
                    example: "07:12:02"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);
    });
    it ("time only positive 2",function(){
        var st={


            types:{
                t1:{
                    type:"time-only",
                    example: "07:12:02.05"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);
    });
    it ("time only negative",function(){
        var st={


            types:{
                t1:{
                    type:"time-only",
                    example: "d3d3:12:22"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(!val);
    });
    it ("time only negative 2",function(){
        var st={


            types:{
                t1:{
                    type:"time-only",
                    example: "07:12:02.05Z"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(!val);
    });
    it ("time only negative 3",function(){
        var st={


            types:{
                t1:{
                    type:"time-only",
                    example: "07:12:02."
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(!val);
    });

    it ("datetime only positive",function(){
        var st={


            types:{
                t1:{
                    type:"datetime-only",
                    example: "2015-07-04T21:00:00"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);
    });

    it ("datetime only positive 2",function(){
        var st={


            types:{
                t1:{
                    type:"datetime-only",
                    example: "2015-07-04T21:00:00.05"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);
    });

    it ("datetime only negative",function(){
        var st={


            types:{
                t1:{
                    type:"datetime-only",
                    example: "33:12:22"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(!val);
    });

    it ("datetime only negative 2",function(){
        var st={


            types:{
                t1:{
                    type:"datetime-only",
                    example: "2015-07-04T21:00:00.123Z"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(!val);
    });

    it ("datetime only negative 3",function(){
        var st={


            types:{
                t1:{
                    type:"datetime-only",
                    example: "2016-13-01T21:00:00.05"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(!val);
    });

    it ("datetime only negative 4",function(){
        var st={


            types:{
                t1:{
                    type:"datetime-only",
                    example: "2015-07-44T21:00:00"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(!val);
    });

    it ("datetime only negative 5",function(){
        var st={


            types:{
                t1:{
                    type:"datetime-only",
                    example: "2015-07-07T12:21:66"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(!val);
    });

    it ("datetime  rfc3339 positive",function(){
        var st={


            types:{
                t1:{
                    type:"datetime",
                    example: "2016-02-28T16:41:41.090Z"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);
    });

    it ("datetime  rfc3339 positive 2",function(){
        var st={


            types:{
                t1:{
                    type:"datetime",
                    example: "2016-02-28T16:41:41.090+06:00"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);
    });

    it ("datetime  rfc3339 positive 3",function(){
        var st={


            types:{
                t1:{
                    type:"datetime",
                    example: "2016-02-28T16:41:41.090-10:30"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);
    });

    it ("datetime  rfc3339 positive 4",function(){
        var st={


            types:{
                t1:{
                    type:"datetime",
                    example: "2016-02-28T16:41:41.090123-10:30"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(val);
    });

    it ("datetime  format rfc2616",function(){
        var st={


            types:{
                t1:{
                    type:"datetime",
                    format: "rfc2616",
                    example: "Sun, 28 Feb 2016 16:41:41 GMT"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(val);
    });
    it ("datetime  rfc3339 negative",function(){
        var st={


            types:{
                t1:{
                    type:"datetime",
                    example: "20161-02-28T16:41:41.090Z"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(!val);
    });

    it ("datetime  rfc3339 negative 2",function(){
        var st={


            types:{
                t1:{
                    type:"datetime",
                    example: "2016-02-52T16:41:41.090Z"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(!val);
    });

    it ("datetime  rfc3339 negative 3",function(){
        var st={


            types:{
                t1:{
                    type:"datetime",
                    example: "2016-02-28T16:72:41.090Z"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var val= t.validateType(ts.builtInRegistry()).isOk();
        assert.isTrue(!val);
    });

    it ("datetime  format rfc2616 negative",function(){
        var st={


            types:{
                t1:{
                    type:"datetime",
                    format: "rfc2616",
                    example: "Sun, 283 Feb 2016 16:41:41 GMT"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(!val);
    });
    it ("null type (negative)",function(){
        var st={


            types:{
                t1:{
                    type:"nil",
                    example: 1
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(!val);
    });
    it ("null type (positive)",function(){
        var st={


            types:{
                t1:{
                    type:"nil",
                    example: <string>null
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(val);
    });
    it ("null type (positive) 2",function(){
        var st={


            types:{
                t1:{
                    type:"string?",
                    example: "a"
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(val);
    });
    it ("null type (positive) 3",function(){
        var st={


            types:{
                t1:{
                    type:"string?",
                    example: <string>null
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(val);
    });

    it ("multiple of (positive)",function(){
        var st={


            types:{
                t1:{
                    type:"number",
                    multipleOf:2,
                    example: 4
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(val);
    });
    it ("multiple of (negative)",function(){
        var st={


            types:{
                t1:{
                    type:"number",
                    multipleOf:3,
                    example: 4
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(!val);
    });

    it ("multiple of value (negative 1)",function(){
        var st={


            types:{
                t1:{
                    type:"number",
                    multipleOf:0,
                    example: 4
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=!status .isOk();
        assert.isTrue(val);
    });
    it ("multiple of value (negative 2)",function(){
        var st={


            types:{
                t1:{
                    type:"number",
                    multipleOf:-2,
                    example: 4
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=!status .isOk();
        assert.isTrue(val);
    });

    it ("inline types",function(){
        var st={


            types:{
                t1:{
                    type:{
                        "type": "number"
                    },
                    multipleOf: 2,
                    example: 4
                },

            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var t=col.getType("t1");
        var status=t.validateType(ts.builtInRegistry());
        var val=status .isOk();
        assert.isTrue(val);
    });
});

describe("Facets tests",function(){

    it ("'usage' facet must be deprecated",function(){
        var st={
            types: {
                T1:
                {
                    usage: "stringValue"
                }
            }
        };
        var col=ps.parseJSONTypeCollection(st);
        var general=col.getType("T1");
        assert(!general.validateType().isOk());
    });

});