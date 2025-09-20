import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function EditIdeaPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="app-card">
        <h1 className="text-2xl font-semibold">Edit Idea</h1>
        <form className="mt-4 space-y-4">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <Input defaultValue="[Current title]" />
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <Textarea rows={6} defaultValue="[Current body]" />
          </div>
          <div>
            <label className="block text-sm mb-1">Tags</label>
            <Input defaultValue="ui, performance" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button>Cancel</Button>
            <Button variant="solid">Save</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


