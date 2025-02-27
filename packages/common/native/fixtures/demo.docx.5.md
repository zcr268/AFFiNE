If no Table of Contents is found in the document, then a table of contents is automatically generated from the headings in the document. A heading is identified as something that has the Heading 1 or Heading 2, etc. style applied to it. These headings are turned into a Table of Contents with Heading 1 being the topmost level, Heading 2 the second level and so on.

 You can see the Table of Contents created by calibre by clicking the Table of Contents button in whatever viewer you are using to view the converted ebook. 

# <a name="_Toc359077862"></a>Images

Images can be of three main types. Inline images are images that are part of the normal text flow, like this image of a green dot ![dot_green.png](./media/image2.png). Inline images do not cause breaks in the text and are usually small in size. The next category of image is a floating image, one that “floats “ on the page and is surrounded by text. Word supports more types of floating images than are possible with current ebook technology, so the conversion maps floating images to simple left and right floats, as you can see with the left and right arrow images on the sides of this paragraph.

The final type of image is a “block” image, one that becomes a paragraph on its own and has no text on either side. Below is a centered green dot.

Centered images like this are useful for large pictures that should be a focus of attention. 

Generally, it is not possible to translate the exact positioning of images from a Word document to an ebook. That is because in Word, image positioning is specified in absolute units from the page boundaries.  There is no analogous technology in ebooks, so the conversion will usually end up placing the image either centered or floating close to the point in the text where it was inserted, not necessarily where it appears on the page in Word.

# <a name="_Toc359077863"></a>Lists

All types of lists are supported by the conversion, with the exception of lists that use fancy bullets, these get converted to regular bullets.

## <a name="_Toc359077864"></a>Bulleted List

- One

- Two

## <a name="_Toc359077865"></a>Numbered List

1. One, with a very long line to demonstrate that the hanging indent for the list is working correctly

2. Two

