import {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType} from 'docx';
import type {CVData} from './cv.types';
import {cvExportBlocks} from './cv.export';
export function wordDocument(cv:CVData){
 const children=cvExportBlocks(cv).map(block=>new Paragraph({
  heading:block.kind==='title'?HeadingLevel.TITLE:block.kind==='heading'?HeadingLevel.HEADING_1:undefined,
  bidirectional:block.dir==='rtl',alignment:block.dir==='rtl'?AlignmentType.RIGHT:AlignmentType.LEFT,
  keepNext:['title','heading','subtitle'].includes(block.kind),widowControl:true,
  spacing:{before:block.kind==='heading'?220:block.kind==='subtitle'?120:0,after:block.kind==='title'?120:80,line:300},
  children:[new TextRun({text:block.text,font:'Arial',size:block.kind==='title'?46:block.kind==='heading'?26:block.kind==='meta'?20:22,bold:['title','heading','subtitle'].includes(block.kind),color:'111111',rightToLeft:block.dir==='rtl'})],
 }));
 return new Document({creator:'TTWar',title:cv.fullName||'Resume',description:'Resume exported locally',styles:{default:{document:{run:{font:'Arial',size:22,color:'111111'}}}},sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1020,right:1020,bottom:1020,left:1020}}},children}]});
}
export function wordBlob(cv:CVData){return Packer.toBlob(wordDocument(cv));}
