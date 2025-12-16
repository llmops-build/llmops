import { hc } from '@client/lib/hc';

const UpdateOrCreateConfigName = ({ id }: { id: string | 'new' }) => {
  const isNew = id === 'new';
  const handleNew = () => {
    const formData = new FormData();
    formData.append('name', 'New Config Name');
    hc.v1.configs.$post({
      form: {
        name: formData.get('name') as string,
      },
    });
  };

  return (
    <div>{isNew ? <button onClick={handleNew}>New</button> : 'Update'}</div>
  );
};

export default UpdateOrCreateConfigName;
