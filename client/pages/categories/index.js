import { useEffect, useState } from "react"
import Link from "next/link"
import { Tree } from "antd"
import { SyncOutlined } from "@ant-design/icons"
import { handleFetch } from "@/lib/api"

const globalFetchFailureMsg = "something went wrong! check your network connectivity";

// categories only carry a flat `parent` id, so the tree has to be assembled client-side
function buildTree(categories) {
    const byParent = new Map();

    categories.forEach(cat => {
        const parentKey = cat.parent || "root";
        if(!byParent.has(parentKey)) byParent.set(parentKey, []);
        byParent.get(parentKey).push(cat);
    });

    const toNode = cat => ({
        key: cat.slugPath,
        title: <Link href={`/categories/${cat.slugPath}`}>{cat.name}</Link>,
        children: (byParent.get(cat._id) || []).map(toNode)
    });

    return (byParent.get("root") || []).map(toNode);
}

const Categories = () => {

    const [categories, setCategories] = useState([]);
    const [spinner, setSpinner] = useState(true);

    useEffect(() => {
        handleFetch(setSpinner, '/api/get-cats', {}, globalFetchFailureMsg, setCategories)
    }, [])

    const productTree = buildTree(categories.filter(cat => cat.type === "product"));
    const serviceTree = buildTree(categories.filter(cat => cat.type === "service"));

    return (
        <div className="container my-5">
            <h1>categories archive</h1>

            {spinner && <div className="text-center py-5"><SyncOutlined spin className="fs-1" /></div>}

            {!spinner && categories.length === 0 && <h3 className="mt-5 text-center">no category found</h3>}

            {!spinner && categories.length > 0 && (
                <div className="row mt-4">
                    <div className="col-md-6 mb-4">
                        <h3>products</h3>
                        {productTree.length === 0
                            ? <p className="text-muted">no product category found</p>
                            : <Tree treeData={productTree} defaultExpandAll selectable={false} />}
                    </div>
                    <div className="col-md-6 mb-4">
                        <h3>services</h3>
                        {serviceTree.length === 0
                            ? <p className="text-muted">no service category found</p>
                            : <Tree treeData={serviceTree} defaultExpandAll selectable={false} />}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Categories
