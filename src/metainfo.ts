/// <reference path="../typings/main.d.ts" />
import ts=require("./typesystem")
import {Status} from "./typesystem";
import {PropertyIs} from "./restrictions";
import _=require("underscore")
import xmlio=require("./xmlio")
import tsInterfaces=require("./typesystem-interfaces")

export class MetaInfo extends ts.TypeInformation {


    constructor(private _name: string,private _value: any,inhertitable:boolean=false){
        super(inhertitable)
    }

    value(){
        return this._value;
    }

    requiredType(){
        return ts.ANY;
    }
    facetName(){
        return this._name;
    }

    kind() : tsInterfaces.MetaInformationKind {
        //to be overriden in subtypes
        return null;
    }
}
export class Description extends MetaInfo{

    constructor(value:string){
        super("description",value)
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Description;
    }
}
export  class NotScalar extends MetaInfo{
    constructor(){
        super("notScalar",true)
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.NotScalar;
    }
}
export class DisplayName extends MetaInfo{


    constructor(value:string){
        super("displayName",value)
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.DisplayName;
    }
}
export class Usage extends MetaInfo{


    constructor(value:string){
        super("usage",value)
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Usage;
    }
}
export class Annotation extends MetaInfo{

    constructor(name: string,value:any){
        super(name,value)
    }

    validateSelf(registry:ts.TypeRegistry):ts.Status {
        var tp=registry.get(this.facetName());
        if (!tp){
            return ts.error(39,this,{facetName: this.facetName()});
        }
        var q=this.value();
        if (!q){
            if (tp.isString()){
                q="";
            }
        }
        var valOwner=tp.validateDirect(q,true,false);
        if (!valOwner.isOk()){
            var res = ts.error(40, this, { msg: valOwner.getMessage() });
            res.addSubStatus(valOwner);
            res.setValidationPath({name:`(${this.facetName()})`});
            return res;
        }
        return ts.ok();
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Annotation;
    }
}
export class FacetDeclaration extends MetaInfo{

    constructor(private name: string,private _type:ts.AbstractType,private optional:boolean){
        super(name,_type,true)
    }
    actualName(){
        if (this.name.charAt(this.name.length-1)=='?'){
            return this.name.substr(0,this.name.length-1);
        }
        return this.name;
    }

    isOptional(){
        return this.optional;
    }
    type():ts.AbstractType{
        return this._type;
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.FacetDeclaration;
    }
}
export class CustomFacet extends MetaInfo{

    constructor(name: string,value:any){
        super(name,value,true)
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.CustomFacet;
    }
}

function serializeToXml(value: any, type: ts.AbstractType): string {
    return xmlio.serializeToXML(value, type);
}

function parseExampleIfNeeded(val:any,type:ts.AbstractType):any{
    if (typeof val==='string'){
        if (type.isObject() || type.isArray() || type.isExternal() || type.isUnion()){
            var exampleString:string=val;
            var firstChar = exampleString.trim().charAt(0);
            if ((firstChar=="{" || firstChar=="[") ){
                try {
                    return JSON.parse(exampleString);
                } catch (e) {
                    if (type.isObject()||type.isArray()){
                        var c = ts.error(41, this, { msg: e.message });
                        return c;
                    }
                }
            }
            if (firstChar=="<") {
                try {
                    var jsonFromXml = xmlio.readObject(exampleString,type);

                    var errors: Status[] = xmlio.getXmlErrors(jsonFromXml);

                    if(errors) {
                        var error = ts.error(42, null);

                        errors.forEach(child => error.addSubStatus(child));
                        
                        return error;
                    }

                    return jsonFromXml;
                } catch (e) {

                }
            }
        }
    }
    if (type.getExtra(tsInterfaces.REPEAT)){
        val=[val];
    }
    return val;
}
export class Example extends MetaInfo{
    constructor(value:any){
        super("example",value)
    }

    validateSelf(registry:ts.TypeRegistry):ts.Status {
        var status = ts.ok();
        status.addSubStatus(this.validateValue(registry));
        status.addSubStatus(this.validateAnnotations(registry));
        return status;
    }

    validateValue(registry:ts.TypeRegistry):ts.Status {
        var val=this.value();
        var isVal=false;
        if (typeof val==="object"&&val){
            if (val.value){
                if (val.strict===false){
                    return ts.ok();
                }
                if (val.strict&&typeof val.strict!="boolean"){
                    var s= ts.error(43,this);
                    s.setValidationPath({name: "example", child: {name: "strict"}})
                    return s;
                }
                val=val.value;
                isVal=true;

            }
        }
        var rr=parseExampleIfNeeded(val,this.owner());
        if (rr instanceof ts.Status){
            rr.setValidationPath({name: "example"})
            return rr;
        }
        var valOwner=this.owner().validateDirect(rr,true,false);
        if (!valOwner.isOk()){
            if (typeof this.value()==="string"){

            }
            var c = ts.error(44, this, { msg : valOwner.getMessage() });
            valOwner.getErrors().forEach(x=>{c.addSubStatus(x);
                if (isVal) {
                    x.setValidationPath({name: "example", child: {name: "value"}});
                }
                else{
                    x.setValidationPath({name: "example"});
                }
            });

            return c;
        }
        return ts.ok();
    }

    validateAnnotations(registry:ts.TypeRegistry):ts.Status {
        var status = ts.ok();
        var val=this.value();
        if (typeof val==="object"&&val){
            if (val.value){
                var usedAnnotations = Object.keys(val).filter(x=>
                x.length>2 && x.charAt(0)=="(" && x.charAt(x.length-1)==")");

                for(var ua of usedAnnotations) {
                    var aValue = val[ua];
                    var aName = ua.substring(1,ua.length-1);
                    var aInstance = new Annotation(aName,aValue);
                    status.addSubStatus(aInstance.validateSelf(registry));
                }
            }
        }
        return status;
    }
    
    example():any{
        var val=this.value();
        if (typeof val==="object"&&val){
            if (val.value){
                val=val.value;
            }
        }
        return parseExampleIfNeeded(val, this.owner());
    }

    asXMLString(): string {
        var value = this.value();

        if(typeof value === 'string' && value.trim().indexOf('<') === 0) {
            return value;
        }

        var parsedValue: any = parseExampleIfNeeded(value, this.owner());

        return serializeToXml(parsedValue, this.owner());
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Example;
    }
}
export class Required extends MetaInfo{
    constructor(value:any){
        super("required",value)
    }

    validateSelf(registry:ts.TypeRegistry):ts.Status {
        if (typeof this.value()!=="boolean"){
            return ts.error(45,this);
        }
        return ts.ok();
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Required;
    }
}

export class HasPropertiesFacet extends MetaInfo{
    constructor(){
        super("hasPropertiesFacet",null);
    }

    validateSelf(registry:ts.TypeRegistry):ts.Status {
        return ts.ok();
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.HasPropertiesFacet;
    }
}
export class AllowedTargets extends MetaInfo{
    constructor(value:any){
        super("allowedTargets",value)
    }

    validateSelf(registry:ts.TypeRegistry):ts.Status {

        return ts.ok();
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.AllowedTargets;
    }
}

export class Examples extends MetaInfo{
    constructor(value:any){
        super("examples",value)
    }

    examples():any[]{
        var v=this.value();
        var result:any[]=[];
        Object.keys(v).forEach(x=>{
            if (typeof v[x]=='object'&&v[x]) {
                var val=v[x].value;
                if (!val){
                    val=v[x];
                }
                var example = parseExampleIfNeeded(val, this.owner());
                result.push(example);
            }
        });
        return result;
    }

    asXMLStrings(): string[] {
        var value = this.value();

        var result: any = {};

        Object.keys(value).forEach(key => {
            var childValue: any = value[key];

            if(typeof childValue === 'string' && childValue.trim().indexOf('<') === 0) {
                result[key] = childValue;

                return;
            }

            var parsedValue: any = parseExampleIfNeeded(childValue, this.owner());

            result[key] = serializeToXml(parsedValue, this.owner());
        });

        return result;
    }

    validateSelf(registry:ts.TypeRegistry):ts.Status {
        if (typeof this.value()==='object'){
            var rs=new Status(Status.OK,0,"",this);
            var v=this.value();
            if (v) {
                Object.keys(v).forEach(x=> {
                    if (v[x]) {
                        var val=v[x].value;
                        var noVal=!val;
                        if (noVal){
                            val=v[x];
                        }
                        else{
                            if (v[x].strict===false){
                                return ;
                            }
                            if (v[x].strict&&typeof v[x].strict!="boolean"){
                                var s= new Status(Status.ERROR,0,"'strict' should be boolean",this);
                                s.setValidationPath({name: x, child: {name: "strict", child: {name: "strict"}}});
                                return s;
                            }
                        }
                        var example = parseExampleIfNeeded(val, this.owner());
                        if (example instanceof ts.Status) {
                            examplesPatchPath(example,noVal,x)
                            rs.addSubStatus(example);
                            return;
                        }
                        var res = this.owner().validate(example, true, false);
                        res.getErrors().forEach(ex=> {
                            rs.addSubStatus(ex);
                            examplesPatchPath(ex,noVal,x)
                        });
                        if (typeof v[x]=="object"&&v[x].value) {
                            Object.keys(v[x]).forEach(key=> {
                                if (key.charAt(0) == '(' && key.charAt(key.length - 1) == ')') {
                                    var a = new Annotation(key.substring(1, key.length - 1), v[x][key]);
                                    rs.addSubStatus(a.validateSelf(registry));
                                }
                            });
                        }
                    }
                });
            }
            return rs;
        }
        else{
            return ts.error(46,this);
        }
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Examples;
    }
}
function examplesPatchPath(example:ts.Status,noVal:boolean,x: string):void{
    if (noVal){
        example.setValidationPath({ name: "examples",child:{name: x}});
    }
    else {
        example.setValidationPath({ name: "examples",child:{name: x, child: {name: "value"}}});
    }
}

export class XMLInfo extends MetaInfo{
    constructor(o:any){
        super("xml",o)
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.XMLInfo;
    }
}

export class Default extends MetaInfo{

    constructor(value:any){
        super("default",value)
    }

    validateSelf(registry:ts.TypeRegistry):ts.Status {
        var valOwner=this.owner().validateDirect(this.value(),true);
        if (!valOwner.isOk()){
            return ts.error(47, this , { msg : valOwner.getMessage() });
        }
        return ts.ok();
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Default;
    }
}
export class Discriminator extends ts.TypeInformation{

    constructor(public property: string){
        super(true);
    }

    requiredType(){
        return ts.OBJECT;
    }

    value(){
        return this.property;
    }
    facetName(){return "discriminator"}

    validateSelf(registry:ts.TypeRegistry):ts.Status {
        var result = ts.ok();
        if (this.owner().isUnion()){
            result = ts.error(48, this);
        }
        else if (!this.owner().isSubTypeOf(ts.OBJECT)){
            result = ts.error(49, this)
        }
        else if (this.owner().getExtra(ts.GLOBAL)===false){
            result = ts.error(50, this)
        }
        else {
            var prop = _.find(this.owner().meta(), x=>x instanceof PropertyIs && (<PropertyIs>x).propertyName() == this.value());
            if (!prop) {
                result = ts.error(51, this, {value: this.value()}, ts.Status.WARNING);
            }
            else if (!prop.value().isScalar()) {
                result = ts.error(52, this)
            }
        }
        result.setValidationPath({name:this.facetName()});
        return result;
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Discriminator;
    }
}

export class DiscriminatorValue extends ts.Constraint{
    constructor(public _value: any, protected strict:boolean=true){
        super(false);
    }

    check(i:any,path:tsInterfaces.IValidationPath):Status{
        var owner = this.owner();//_.find([t].concat(t.allSuperTypes()),x=>x.getExtra(TOPLEVEL));
        var dVal:string = this.value();
        var discriminator = owner.metaOfType(Discriminator);
        if(discriminator.length==0){
            return ts.ok();
        }
        var dName = discriminator[0].value();
        // if(owner) {
        //     dVal = owner.name();
        // }
        // var discriminatorValue = t.metaOfType(metaInfo.DiscriminatorValue);
        // if(discriminatorValue.length!=0){
        //     dVal = discriminatorValue[0].value();
        // }
        if(dVal) {
            if (i.hasOwnProperty(dName)) {
                var adVal = i[dName];
                if (adVal != dVal) {
                    var wrng = ts.error(Status.CODE_INCORRECT_DISCRIMINATOR, this, {
                        rootType : owner.name(),
                        value: adVal,
                        propName: dName
                    }, Status.WARNING );
                    //var wrng = new Status(Status.WARNING, Status.CODE_INCORRECT_DISCRIMINATOR, dVal, this);
                    wrng.setValidationPath({name: dName, child: path});
                    return wrng;
                }
                return ts.ok();
            }
            else {
                var err = ts.error(Status.CODE_MISSING_DISCRIMINATOR, this, {
                    rootType: owner.name(),
                    propName: dName
                });
                //var err = new Status(Status.ERROR, Status.CODE_MISSING_DISCRIMINATOR, dVal, this);
                err.setValidationPath(path);
                return err;
            }
        }
    }
    facetName(){return "discriminatorValue"}

    validateSelf(registry:ts.TypeRegistry):ts.Status {
        if(!this.strict){
            return ts.ok();
        }
        if (!this.owner().isSubTypeOf(ts.OBJECT)){
            return ts.error(49, this);
        }
        if (this.owner().getExtra(ts.GLOBAL)===false){
            return ts.error(50, this);
        }
        var ds=this.owner().oneMeta(Discriminator);
        if (!ds){
            return ts.error(53, this);
        }
        var prop=_.find(this.owner().meta(),x=>x instanceof PropertyIs&& (<PropertyIs>x).propertyName()==ds.value());
        if (prop){
            var sm=prop.value().validate(this.value());
            if (!sm.isOk()){
                return ts.error(54, this, { msg : sm.getMessage() });
            }
        }
        return ts.ok();
    }

    requiredType(){
        return ts.OBJECT;
    }
    value(){
        return this._value;
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.DiscriminatorValue;
    }
    
    isStrict():boolean{ return this.strict; }
}