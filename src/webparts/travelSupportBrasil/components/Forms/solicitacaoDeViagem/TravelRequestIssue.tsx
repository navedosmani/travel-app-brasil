import * as React from 'react';
import { TextField, Select, MenuItem, FormLabel, Grid, Button, Input, Paper, Typography, Snackbar, FormControl, RadioGroup, FormControlLabel, Radio, makeStyles, Theme, createStyles, InputLabel, Backdrop, CircularProgress } from '@material-ui/core';
import { useState, useContext, useEffect } from 'react';
import { useForm, Controller } from "react-hook-form";
import { Alert } from '@material-ui/lab';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers';
import { getEmployee } from '../../../services/EmployeesService';
import { newRequest } from '../../../services/RequestServices';
import { IEmployee } from '../../../Interfaces/IEmployee';
import { IRequests_AllFields } from '../../../Interfaces/Requests/IRequests';
import { ISnack } from '../../../Interfaces/ISnack';
import { Context } from '../../Context';
import HocDialog from '../../HOC/HocDialog';
import { yup_pt_br } from '../../../Utils/yup_pt_br';
import { setLocale } from 'yup';
import { IAttachmentFileInfo } from '@pnp/sp/attachments';
import { sp } from '@pnp/sp';

setLocale(yup_pt_br);


const schema: yup.ObjectSchema<IRequests_AllFields> = yup.object().shape({
  MACROPROCESSO: yup.string().required(),
  PROCESSO: yup.string().required(),
  SLA: yup.number().default(48),
  AREA_RESOLVEDORA: yup.string().default("Viagens Corporativas"),
  ALCADA_APROVACAO: yup.string().default(""),
  WF_APROVACAO: yup.boolean().default(false),
  DATA_DE_APROVACAO: yup.date().default(new Date()),
  STATUS_APROVACAO: yup.string().default('Aprovado'),

  BENEFICIARIO_ID: yup.string().required(),
  BENEFICIARIO_NOME: yup.string().required(),
  BENEFICIARIO_EMAIL: yup.string().email().required(),
  BENEFICIARIO_EMPRESA_COD: yup.string(),
  BENEFICIARIO_EMPRESA_NOME: yup.string(),

  MOTIVO: yup.string()
  .required()
});

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: '#fff',
    },
  }),
);


export default function TravelRequestIssue() {
  const { register, handleSubmit, control, errors, reset, setValue } = useForm<IRequests_AllFields>({
    resolver: yupResolver(schema)
  });
  const [employee, setEmployee] = useState<IEmployee>();
  const [snackMessage, setSnackMessage] = useState<ISnack>({
    open: false,
    message: "",
    severity:'info'
  });
  const { updateContext } = useContext(Context);
  const classes = useStyles();
  const [openBackdrop, setOpenBackdrop] = useState(false);
  const [fileInfos, setFileInfos] = useState<IAttachmentFileInfo[]>([]);


  const handleGetEmployee = value => getEmployee("IAM_ACCESS_IDENTIFIER", value.toUpperCase())
  .then(emp => {
    setEmployee(emp);
    setValue("BENEFICIARIO_ID", emp?emp.IAM_ACCESS_IDENTIFIER:"", {
      shouldDirty: true
    });
    setValue("BENEFICIARIO_NOME", emp?emp.FULL_NAME:"", {
      shouldDirty: true
    });
    setValue("BENEFICIARIO_EMAIL", emp?emp.WORK_EMAIL_ADDRESS:"", {
      shouldDirty: true
    });
    setValue("BENEFICIARIO_EMPRESA_NOME", emp?emp.COMPANY_DESC:"", {
      shouldDirty: true
    });
    setValue("BENEFICIARIO_NACIONALIDADE", emp?emp.FACILITY_COUNTRY:"", {
      shouldDirty: true
    });
    setValue("CENTRO_DE_CUSTOS", emp?emp.COST_CENTER_CODE:"", {
      shouldDirty: true
    });
  });

  const handleGetEmployeeByEmail = value => getEmployee("WORK_EMAIL_ADDRESS", value.toLowerCase())
  .then(emp => {
    setEmployee(emp);
    setValue("BENEFICIARIO_ID", emp?emp.IAM_ACCESS_IDENTIFIER:"", {
      shouldDirty: true
    });
    setValue("BENEFICIARIO_NOME", emp?emp.FULL_NAME:"", {
      shouldDirty: true
    });
    setValue("BENEFICIARIO_EMAIL", emp?emp.WORK_EMAIL_ADDRESS:"", {
      shouldDirty: true
    });
    setValue("BENEFICIARIO_EMPRESA_NOME", emp?emp.COMPANY_DESC:"", {
      shouldDirty: true
    });
    setValue("BENEFICIARIO_NACIONALIDADE", emp?emp.FACILITY_COUNTRY:"", {
      shouldDirty: true
    });
    setValue("CENTRO_DE_CUSTOS", emp?emp.COST_CENTER_CODE:"", {
      shouldDirty: true
    });
  });

  const onSubmit = (data:IRequests_AllFields, e) => {
    newRequest(data)
      .then(result => {
        setOpenBackdrop(true);
        return result;
      })
      .then(result =>
        uploadListAttachments(result.data.ID)
          .then(()=> result)
          .catch(error => {
            alert(error);
            return result;
          })
      )
      .then(res => {
        setOpenBackdrop(false);
        setSnackMessage({open:true, message: `Solicita????o gravada com sucesso! ID:${res.data.ID}`, severity:"success"});
        updateContext();
      })
      .catch(error => {
        setOpenBackdrop(false);
        setSnackMessage({open:true, message: "Falha ao tentar gravar a solicita????o", severity:"error"});
        console.log(error);
      });
    e.target.reset();
  };

  function blob(e) {
    //Get the File Upload control id
    var fileCount = e.target.files.length;
    console.log(fileCount);
    let filesToAdd = [];
    for (let i = 0; i < fileCount; i++) {
      let fileName = e.target.files[i].name;
      console.log(fileName);
      let file = e.target.files[i];
      let reader = new FileReader();
      reader.onload = (fileToConvert => (readerEvent) =>
        filesToAdd.push({
          "name": fileToConvert.name,
          "content": readerEvent.target.result
        }))(file);
      reader.readAsArrayBuffer(file);
    }//End of for loop
    setFileInfos(filesToAdd);
  }

  function uploadListAttachments(id) {
    var item = sp.web.lists.getByTitle("SOLICITACOES").items.getById(id);
    return item.attachmentFiles.addMultiple(fileInfos);
  }

  return (
    <Paper>
      <HocDialog>
        <Typography variant='h6'>
          Loca????o de ve??culo:
        </Typography>
        <Typography variant='body2'>
          Antes da loca????o de ve??culos devem ser observadas as  orienta????es da ??rea de Seguran??a da Vale. O pagamento dos servi??os prestados pelas locadoras ?? efetuado diretamente pelo empregado, em um cart??o de cr??dito, no momento da entrega do ve??culo. ?? obrigat??ria a contrata????o do seguro na locadora com cobertura para danos causados ao carro alugado e terceiros. O empregado deve ter ci??ncia das regras estabelecidas no contrato de loca????o. Em caso de cobran??a indevida, acione a locadora contratada.
        </Typography>
        <br/>

        <Typography variant='h6'>
          Emiss??o de visto:
        </Typography>
        <Typography variant='body2'>
          As solicita????es de vistos para viagens corporativas devem realizadas atrav??s do portal do fornecedor CIBT Visas. Para solicitar um visto acesse o link : https://cibtvisas.com.br/VALE. Em caso de problemas com a emiss??o de um visto, preencha o formul??rio a seguir.
        </Typography>
        <br/>

        <Typography variant='h6'>
          Seguro viagem:
        </Typography>
        <Typography variant='body2'>
          O seguro viagem ?? emitido ap??s aprova????o da passagem a??rea internacional e a ap??lice ?? encaminhada para o e-mail do viajante em at?? 24 horas antes do embarque.
          <br/>
          Se precisar utilizar o seguro viagem no exterior, siga as instru????es que constam no manual enviado juntamente com o seu voucher. Em caso de d??vida, entre em contato com a central de atendimento da Assist-Card Em caso de problemas com a emiss??o de um seguro, preencha o formul??rio a seguir.
        </Typography>
        <br/>

        <Typography variant='h6'>
          Dificuldade de acesso ao sistema:
        </Typography>
        <Typography variant='body2'>
          Para abrir o Sistema de Viagens, digite http://travel.valeglobal.net no seu navegador. Se estiver fora da rede Vale, ?? necess??rio inserir suas credenciais (login e senha) de acesso ?? rede.
          <br/>
          Para desbloqueio do acesso ao sistema ap??s regulariza????o da pend??ncia de presta????o de contas, acesse o formul??rio "Presta????o de contas > Desbloqueio do cart??o corporativo e Sistema de Viagens ap??s regulariza????o de pend??ncia"
        </Typography>
      </HocDialog>
      <div style={{padding:"20px"}}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3} justify="space-between">
          <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
            <FormLabel id="Macroprocesso" component="legend">Macroprocesso</FormLabel>
            <Controller
              as={
                <Select disabled fullWidth>
                  <MenuItem value="Solicita????o de viagem"> Solicita????o de viagem </MenuItem>
                </Select>
              }
              name="MACROPROCESSO"
              defaultValue="Solicita????o de viagem"
              control={control}
              error={errors.MACROPROCESSO?true:false}
              helperText={errors.MACROPROCESSO && errors.MACROPROCESSO.message}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
            <FormLabel id="PROCESSO" component="legend">Processo</FormLabel>
            <Controller
              as={
                <Select fullWidth >
                  <MenuItem value="Dificuldade de acesso ao sistema">Dificuldade de acesso ao sistema</MenuItem>
                  <MenuItem value="Passagem a??rea">Passagem a??rea</MenuItem>
                  <MenuItem value="Hospedagem">Hospedagem</MenuItem>
                  <MenuItem value="Loca????o de ve??culo">Loca????o de ve??culo</MenuItem>
                  <MenuItem value="Emiss??o de visto">Emiss??o de visto</MenuItem>
                  <MenuItem value="Seguro viagem">Seguro viagem</MenuItem>
                </Select>
              }
              id="Process"
              name="PROCESSO"
              defaultValue=""
              control={control}
              error={errors.PROCESSO?true:false}
              helperText={errors.PROCESSO && errors.PROCESSO.message}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={4} lg={4} xl={4} >
            <TextField
              fullWidth
              variant="outlined"
              type="search"
              name="BENEFICIARIO_ID"
              label="Empregado: Matr??cula"
              onBlur={ e=> handleGetEmployee(e.target.value) }
              inputRef={register}
              InputLabelProps={{ shrink: true }}
              error={errors.BENEFICIARIO_ID?true:false}
              helperText={errors.BENEFICIARIO_ID && errors.BENEFICIARIO_ID.message}
            />
          </Grid>
          <Grid item xs={12} sm={8} md={8} lg={8} xl={8} >
            <TextField
              fullWidth
              type="text"
              name="BENEFICIARIO_EMAIL"
              label="Empregado: e-mail"
              variant="outlined"
              inputRef={register}
              onBlur={ e=> handleGetEmployeeByEmail(e.target.value) }
              InputLabelProps={{ shrink: true }}
              error={errors.BENEFICIARIO_EMAIL?true:false}
              helperText={errors.BENEFICIARIO_EMAIL && errors.BENEFICIARIO_EMAIL.message}
            />
          </Grid>

          <Grid item xs={12} sm={12} md={12} lg={12} xl={12} >
            <TextField disabled fullWidth type="text" name="BENEFICIARIO_NOME"
              label="Empregado: Nome" variant="outlined"
              inputRef={register}
              InputLabelProps={{ shrink: true }}
              error={errors.BENEFICIARIO_NOME?true:false}
              helperText={errors.BENEFICIARIO_NOME && errors.BENEFICIARIO_NOME.message}
            />
          </Grid>

          <Grid item xs={12} sm={12} md={12} lg={12} xl={12} >
            <TextField fullWidth variant="outlined" type="text"
            multiline rows={5}
            name="MOTIVO" label="Descri????o detalhada do problema" inputRef={register}
              error={errors.MOTIVO?true:false}
              helperText={errors.MOTIVO && errors.MOTIVO.message}
            />
          </Grid>

          <Grid item xs={12} sm={12} md={12} lg={12} xl={12} >
            <InputLabel>
              Anexos
            </InputLabel>
            <br/>
            <input type="file" multiple onChange={e => blob(e)}/>
          </Grid>

          <Grid xs={12} sm={12} md={12} lg={12} xl={12} item justify="flex-end" alignItems="flex-end">
            <Button type="submit"
            variant="contained" color="primary" style={{float:'right'}}> Enviar </Button>
          </Grid>

          <Input inputRef={register} readOnly type="hidden" id="BENEFICIARIO_EMPRESA_COD" name="BENEFICIARIO_EMPRESA_COD"
            value={employee && employee.COMPANY_CODE }
          />
          <Input inputRef={register} readOnly type="hidden" id="BENEFICIARIO_EMPRESA_NOME" name="BENEFICIARIO_EMPRESA_NOME"
            value={employee && employee.COMPANY_DESC } />
        </Grid >
      </form>

      <Snackbar
        anchorOrigin={{ vertical:'top', horizontal:'right' }}
        open={snackMessage.open}
        onClose={()=>setSnackMessage({...snackMessage, open:false})}
        key={'top' + 'right'}
      >
        <Alert onClose={()=>setSnackMessage({...snackMessage, open:false})} severity={snackMessage.severity}>
          {snackMessage.message}
        </Alert>
      </Snackbar>

      </div>
      <div>
        <Backdrop className={classes.backdrop} open={openBackdrop}>
          <Typography variant='h4'> Aguarde, estamos salvando as informa????es... </Typography>
          <CircularProgress color="inherit" />
        </Backdrop>
      </div>
    </Paper>

  );
}
