import test from "node:test";
import assert from "node:assert/strict";
import {parsePublicMetadata} from "../scripts/probe-public-marketplace.mjs";

const url="https://detail.1688.com/offer/1060230352625.html";
test("uses actual CNY-labeled product metadata only",()=>{
 const html='<html><head><meta property="og:type" content="product"><meta property="og:title" content="Cotton shirt for summer"><meta property="og:description" content="A lightweight cotton shirt in multiple sizes"><meta property="og:image" content="https://img.example.test/image.jpg"><meta property="product:price:amount" content="19.90"><meta property="product:price:currency" content="CNY"></head></html>';
 const result=parsePublicMetadata(html,url);
 assert.equal(result.status,"public_metadata");
 assert.equal(result.priceCNY,19.9);
 assert.deepEqual(result.fields,["title","image","description","priceCNY"]);
});
test("does not assume a title on a generic login or homepage is a product",()=>{
 const html='<html><head><title>Taobao - Shopping online</title><meta property="og:image" content="https://img.example.test/logo.jpg"></head></html>';
 const result=parsePublicMetadata(html,url);
 assert.equal(result.status,"insufficient_product_fields");
 assert.equal(result.title,null);
});
test("explicit verification page must never count as enrichment",()=>{
 const result=parsePublicMetadata('<title>Security Check - Verify You Are Human</title>',url);
 assert.equal(result.status,"access_restricted");
});
test("never interprets unlabeled foreign-currency prices as CNY",()=>{
 const html='<meta property="og:type" content="product"><meta property="og:title" content="Cotton shirt"><meta property="product:price:amount" content="100.00"><meta property="product:price:currency" content="USD">';
 const result=parsePublicMetadata(html,url);
 assert.equal(result.priceCNY,null);
});
