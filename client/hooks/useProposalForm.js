import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getErrorMessage } from "@/lib/strings";

export default function useProposalForm(
  providerId, requestId, requester, path,
  initialContent = '',
  initialPrice = 0,
  initialImages = [],
  requestType= 'POST',
) {

  const MAX_IMAGES = 5;
  const ALLOWED_MIMES = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];

  const [proposalContent, setProposalContent] = useState(initialContent)
  const [proposalPrice, setProposalPrice] = useState(initialPrice);
  const [proposalImages, setproposalImages] = useState(initialImages);
  const [spinner, setSpinner] = useState(false)

  const router = useRouter();

  useEffect(() => {
    if(String(requester) === providerId) {
      toast.error("you can't submit proposal on your own request");
      router.replace('/requests');
    }
  }, [requester, providerId, router])

  // keep refrence to images to revoke their temp url during component umount
  const proposalImagesRef = useRef([]);

  useEffect(() => {

    proposalImagesRef.current = proposalImages

  }, [proposalImages])

  useEffect(() => {
    return () => {
      proposalImagesRef.current.forEach(img=> URL.revokeObjectURL(img.url))
    }
  }, [])

  const handleProposalImages = e => {
    const selectedFiles = Array.from(e.target.files || []);

    if(!selectedFiles.length) return;

    const unAllowed = selectedFiles.findIndex(img=> !ALLOWED_MIMES.includes(img.type))
    if(unAllowed !== -1) {
      toast.error("only images are allowed");
      e.target.value = ''
      return;
    }

    setproposalImages(prev => {
      
      const remainingSlots = MAX_IMAGES - prev.length

      if(remainingSlots <= 0) {
        toast.error("maximum 5 images are allowed")
        return prev;
      }


      if(selectedFiles.length > remainingSlots) {
        toast.error("maximum 5 images are allowed")
      }

      const allowedImages = selectedFiles.slice(0, remainingSlots);

      const newItems = allowedImages.map(img=> ({
        id: `${img.name}-${img.size}-${img.lastModified}-${crypto.randomUUID()}`,
        alt: img.name,
        file: img,
        url: URL.createObjectURL(img)
      }))

      return [...prev, ...newItems]
    })

    e.target.value=''
  }

  const removeImage = (e, selected) => {
    e.preventDefault()

    setproposalImages(prev=> {

      const remainingImages = prev.filter(img=> (img.id || img._id) !== (selected.id || selected._id))

      URL.revokeObjectURL(selected.url)

      return remainingImages
    })
  }

  const submitProposal = async e => {
    e.preventDefault()

    if(!proposalPrice) {
      toast.error("you should determine a price for your proposal");
      return;
    }

    if(!proposalContent) {
      toast.error("write a bit about your proposal");
      return;
    }

    try {
      setSpinner(true)

      const formData = new FormData();

      formData.append('requestId', requestId)
      formData.append('provider', providerId)
      formData.append('proposalContent', proposalContent)
      formData.append('proposalPrice', proposalPrice)

      proposalImages.filter(img=> img.file).forEach(img=> formData.append('proposalImages', img.file))
      proposalImages.filter(img=> !img.file).forEach(img=> formData.append('existingImages', img.id || img._id))

      const fetchConfig = {
        method: requestType,
        body: formData
      }

      const res = await apiFetch(path, fetchConfig);
      const {ok, message} = await res.json();

      if(!res.ok || !ok) {
        toast.error(message || "failed to submit proposal! please try again")
        return
      }

      router.replace(`/dashboard/my-proposals/${message}`)

    } catch(err) {
      toast.error(getErrorMessage(err))
      return
    } finally {
      setSpinner(false)
    }
  }

  return {
    proposalContent, setProposalContent,
    proposalPrice, setProposalPrice,
    proposalImages, setproposalImages,
    spinner, setSpinner,
    submitProposal,
    removeImage, handleProposalImages
  }
}