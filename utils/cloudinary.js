const cloudinary = require("cloudinary");  
const fs = require("fs");


cloudinary.v2.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const upload = async (localfilepath)=>{
    try {
        if(!localfilepath) return null;
        const res = await cloudinary.v2.uploader.upload(localfilepath,{
            resource_type : "auto"
        })

        console.log("file uploaded");
        return res;
    } catch (error) {
        fs.unlinkSync(localfilepath);

        return null;
    }
}

async function deleteResources(publicIds,type) {
    try {
      const result = await cloudinary.v2.api.delete_resources(publicIds, { resource_type: type });
      console.log("Deletion result:", result);
      return result.deleted;
    } catch (error) {
      console.error("Error deleting resources:", error);
      throw error;
    }
}
module.exports = {
    upload,deleteResources

}