// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { supabase } from "../../helper";

const storageName = 'temp-storage'

export default function handler(req, res) {
  let timeOut = process.env.NEXT_TIME_EXECUTION
  let imageID = req.query.id
  console.log(imageID)
  res.json({ message: 'success!' })

  setTimeout(async () => {
    let execute = await deleteWrapper(imageID)
    execute == false && console.log('failed delete from storage and DB')
  }, timeOut);
}

const deleteWrapper = async (imageID) => {
  let deleteFromStorage = await deleteImageFromStorage(imageID)
  let deleteFromDB = await deleteImageReferenceFromDB(imageID)
  console.log('deleteFromStorage', deleteFromStorage)
  console.log('deleteFromDB', deleteFromDB)
  return deleteFromDB
}

const deleteImageFromStorage = async (fileName, retry = 3) => {
  let deleteImage = await supabase.storage.from(storageName).remove([fileName])
  // console.log(deleteImage)

  if (deleteImage.error) {
    if (retry > 0) return deleteImageFromStorage(fileName, retry - 1)
    console.log('Failed to delete image from storage')
  }
  else {
    console.log('success delete image from storage')
    return true
  }
}

const deleteImageReferenceFromDB = async (imageID, retry = 3) => {
  let deleteImageReference = await supabase.from('temp_storage').delete().eq('file_name', imageID)
  // console.log(deleteImageReference)

  if (deleteImageReference.error) {
    if (retry > 0) return deleteImageReferenceFromDB(imageID, retry - 1)
    console.log('Failed to delete reference image from DB')
  }
  else {
    console.log('success delete reference image from DB')
    return true
  }
}
